"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { chapter as chapterFor, CHAPTERS } from "./chapters";
import { setChapter, setPresence, vela, useVelaSnapshot } from "./store";

/**
 * THE STAGE — one fixed layer behind every page.
 *
 * It lives in the root layout, so the object is never torn down between
 * routes: navigating is the same structure walking somewhere else, not a new
 * scene loading. Three layers, cheapest first:
 *
 *   1. the server-rendered still (passed in as `still`) — paints with the HTML
 *   2. the WebGL renderer — imported after the page is idle, fades in on its
 *      first frame, never on the critical path of the largest paint
 *   3. the hit target — a real <button> that tracks the object on screen,
 *      so "talk to it" works by pointer, touch and keyboard alike
 *
 * Decorative to assistive technology except for the button, which is named.
 */

type Mode = "still" | "canvas";

function detectTier(): { ok: boolean; tier: "full" | "lite"; reducedMotion: boolean } {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };
  if (nav.connection?.saveData) return { ok: false, tier: "lite", reducedMotion };
  // No probe context. Creating one starts the GPU process, which on a phone
  // is a long task in the middle of hydration; the renderer creates the real
  // context later, at idle, and falls back to the still if it cannot.
  const ok = typeof WebGL2RenderingContext !== "undefined";
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = window.innerWidth < 820;
  const weak = (nav.deviceMemory ?? 8) <= 4 || (navigator.hardwareConcurrency ?? 8) <= 4;
  return { ok, tier: coarse || small || weak ? "lite" : "full", reducedMotion };
}

export function VelaStage({ still }: { readonly still: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitRef = useRef<HTMLButtonElement>(null);
  const stillRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("still");
  const [live, setLive] = useState(false);
  const { presence, chapter, voiceOpen } = useVelaSnapshot();
  const pathname = usePathname();

  /* The renderer: after idle, only if the device can carry it. */
  useEffect(() => {
    const { ok, tier, reducedMotion } = detectTier();
    if (!ok) return;
    let disposed = false;
    let renderer: { dispose(): void; start(): void } | null = null;

    const boot = async () => {
      const [{ ArmatureRenderer }, { buildArmature }] = await Promise.all([
        import("./renderer"),
        import("./geometry"),
      ]);
      console.info("[vela] renderer module loaded");
      // Loading the module, building the structure (cached) and creating the
      // GL context each get their own task.
      const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
      await frame();
      if (disposed) return;
      buildArmature();
      await frame();
      if (disposed || !canvasRef.current) return;
      try {
        const r = new ArmatureRenderer(canvasRef.current, {
          tier,
          reducedMotion,
          onFirstFrame: () => {
            setMode("canvas");
            setLive(true);
          },
          onFail: () => {
            setMode("still");
            setLive(false);
          },
          onLayout: (cx, cy, radius) => {
            const hit = hitRef.current;
            if (hit) {
              const d = Math.max(96, radius * 1.5);
              hit.style.transform = `translate3d(${cx - d / 2}px, ${cy - d / 2}px, 0)`;
              hit.style.width = hit.style.height = `${d}px`;
            }
          },
        });
        renderer = r;
        r.start();
      } catch (e) {
        console.warn("[velabuilt] object unavailable:", e);
      }
    };

    const hasIdle = typeof window.requestIdleCallback === "function";
    const idle = hasIdle
      ? window.requestIdleCallback(() => void boot(), { timeout: 1200 })
      : setTimeout(() => void boot(), 350);

    return () => {
      disposed = true;
      if (hasIdle) window.cancelIdleCallback(idle as number);
      else clearTimeout(idle);
      renderer?.dispose();
    };
  }, []);

  /* The still follows the placement too, so the fallback is not frozen. */
  useEffect(() => {
    const el = stillRef.current;
    const c = CHAPTERS[chapter];
    if (!el || !c) return;
    const mobile = window.innerWidth < 820;
    const p = (mobile && c.mobilePlacement) || c.placement;
    el.style.transform = `translate3d(${p.x * 100}vw, ${-p.y * 100}svh, 0) scale(${p.scale})`;
    el.style.opacity = String(mode === "canvas" ? 0 : p.presence);
  }, [chapter, mode]);

  /* Scroll, pointer, chapters. The only scroll listener on the site. */
  useEffect(() => {
    let raf = 0;
    let lastY = window.scrollY;
    let current = "";
    const mobileQuery = window.matchMedia("(max-width: 819px)");

    const read = () => {
      raf = 0;
      const y = window.scrollY;
      vela.scrollVelocity = vela.scrollVelocity * 0.8 + (y - lastY) * 0.2;
      lastY = y;

      const vh = window.innerHeight;
      const line = vh * 0.5;
      let found: string | null = null;
      let covered = false;
      for (const el of document.querySelectorAll<HTMLElement>("[data-chapter]")) {
        const r = el.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) found = el.dataset.chapter ?? null;
        if (el.classList.contains("sheet") && r.top <= 0 && r.bottom >= vh) covered = true;
      }
      if (covered !== vela.covered) {
        vela.covered = covered;
        if (!covered) vela.invalidate();
      }
      const next = chapterFor(found);
      if (next && next.id !== current) {
        current = next.id;
        setChapter(next, mobileQuery.matches);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      vela.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      vela.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
      vela.pointer.active = true;
    };
    const onLeave = () => (vela.pointer.active = false);

    // Route changes: re-read once the new page is in the DOM.
    current = "";
    const settle = window.setTimeout(read, 30);
    read();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [pathname]);

  const c = CHAPTERS[chapter];
  const touchable = !!c && c.placement.presence > 0.5 && (chapter === "opening" || chapter === "contact");

  return (
    <div
      className="vela-stage"
      data-live={live || undefined}
      data-rings={chapter === "opening" || chapter === "contact" ? "on" : "off"}
    >
      <div className="vela-bg" aria-hidden="true" />
      <div className="vela-rings" aria-hidden="true" />
      <div ref={stillRef} className="vela-still-wrap" aria-hidden="true">
        {still}
      </div>
      <canvas ref={canvasRef} className="vela-canvas" aria-hidden="true" data-on={mode === "canvas" || undefined} />
      <button
        ref={hitRef}
        type="button"
        className="vela-hit"
        data-touchable={touchable || undefined}
        tabIndex={touchable ? 0 : -1}
        aria-label={voiceOpen ? "Vela is open" : "Talk to Vela, VelaBuilt’s voice guide"}
        onPointerEnter={() => presence === "dormant" && setPresence("aware")}
        onPointerLeave={() => vela.presence === "aware" && setPresence("dormant")}
        onFocus={() => presence === "dormant" && setPresence("aware")}
        onBlur={() => vela.presence === "aware" && setPresence("dormant")}
        onClick={() => window.dispatchEvent(new CustomEvent("vela:talk"))}
      >
        <span className="vela-hit__label" data-show={presence === "aware" && !voiceOpen || undefined}>
          Talk to Vela
        </span>
      </button>
    </div>
  );
}
