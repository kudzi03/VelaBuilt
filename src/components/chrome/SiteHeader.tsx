"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { primaryNav } from "@/content/site";
import { Wordmark } from "./Monogram";
import { StartProjectLink } from "@/components/enquiry/StartProjectLink";
import { TalkButton } from "@/voice/VoiceRoot";
import { useVelaSnapshot } from "@/vela/store";

/**
 * Quiet at the edge. The wordmark, four destinations with a lit marker under
 * the current one, and two ways to act: talk to Vela, or start a project.
 * Transparent over the field until the visitor scrolls, then a frosted strip.
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const { presence, chapter } = useVelaSnapshot();

  const [menu, setMenu] = useState({ open: false, path: pathname });
  const menuOpen = menu.open && menu.path === pathname;
  const setMenuOpen = useCallback((open: boolean) => setMenu({ open, path: pathname }), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    toggleRef.current?.focus();
  }, [setMenuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      document.documentElement.classList.remove("no-scroll");
      return;
    }
    document.documentElement.classList.add("no-scroll");
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.documentElement.classList.remove("no-scroll");
    };
  }, [menuOpen, closeMenu]);

  const isActive = (href: string) => {
    if (href === "/#capabilities") {
      return (
        (pathname === "/" && ["digital", "ai", "automation", "systems"].includes(chapter)) ||
        ["/website-conversion-systems", "/ai-systems", "/lead-follow-up-systems", "/business-systems", "/website-engine-optimization"].includes(pathname)
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="site-header" data-scrolled={scrolled || menuOpen || undefined} data-presence={presence}>
      <nav aria-label="Primary" className="shell flex h-full items-center justify-between gap-6">
        <Link href="/" className="shrink-0 py-2" aria-label="VelaBuilt — home">
          <Wordmark />
        </Link>

        <ul className="hidden items-center gap-7 lg:flex">
          {primaryNav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="nav-link" aria-current={isActive(item.href) ? "page" : undefined}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <TalkButton className="btn btn-ghost hidden sm:inline-flex">Talk to Vela</TalkButton>
          <StartProjectLink variant="primary" withArrow={false} className="hidden lg:inline-flex">
            Start a project
          </StartProjectLink>
          <button
            ref={toggleRef}
            type="button"
            className="btn !min-h-[2.75rem] !px-3 lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
            <span aria-hidden="true" className="relative block h-2.5 w-5">
              <span
                className="absolute inset-x-0 top-0 h-px bg-[color:var(--color-ivory)] transition-transform duration-500"
                style={{ transform: menuOpen ? "translateY(5px) rotate(45deg)" : undefined }}
              />
              <span
                className="absolute inset-x-0 top-2.5 h-px bg-[color:var(--color-ivory)] transition-transform duration-500"
                style={{ transform: menuOpen ? "translateY(-5px) rotate(-45deg)" : undefined }}
              />
            </span>
          </button>
        </div>
      </nav>

      <div
        id="mobile-nav"
        hidden={!menuOpen}
        className="fixed inset-x-0 bottom-0 top-[var(--nav-height)] z-40 overflow-y-auto bg-[color:var(--color-paper)] lg:hidden"
      >
        <div className="shell flex min-h-full flex-col justify-between pb-10 pt-6">
          <ul>
            {[{ label: "Home", href: "/" }, ...primaryNav, { label: "Start a project", href: "/start" }].map((item, index) => (
              <li key={item.href} className="border-b border-[color:var(--color-hairline)]">
                <Link href={item.href} className="flex items-baseline gap-5 py-5" onClick={() => setMenuOpen(false)}>
                  <span className="label">{String(index + 1).padStart(2, "0")}</span>
                  <span className="display-md">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-col gap-3">
            <TalkButton className="btn w-full">Talk to Vela</TalkButton>
          </div>
        </div>
      </div>
    </header>
  );
}
