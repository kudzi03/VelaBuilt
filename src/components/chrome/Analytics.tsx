"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { analyticsEnabled, track } from "@/lib/analytics";

const BOOKING_HOSTS = /(^|\.)(calendly\.com|cal\.com|savvycal\.com|tidycal\.com)$|calendar\.app\.google|calendar\.google\.com\/calendar\/appointments/;

/**
 * First-party analytics (see src/lib/analytics.ts). Loads no third-party
 * script. Reports page views on every navigation and the clicks that matter
 * for leads through one delegated listener.
 */
export function Analytics() {
  const pathname = usePathname();
  const entryReferrer = useRef<string | null>(null);
  const scrolled = useRef(false);

  // Page views, including client-side navigation.
  useEffect(() => {
    if (!analyticsEnabled) return;
    const first = entryReferrer.current === null;
    if (first) entryReferrer.current = document.referrer;
    scrolled.current = false;
    // Let the new page set its title first.
    const t = window.setTimeout(() => {
      track("page_view", {
        page_path: pathname,
        ...(first && document.referrer ? { page_referrer: document.referrer, entry_referrer: document.referrer } : {}),
      });
    }, 50);
    return () => window.clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    if (!analyticsEnabled) return;

    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target?.closest) return;

      const demo = target.closest<HTMLElement>("[data-demo]");
      if (demo && target.closest("button, a, [role=button], [role=tab]")) {
        track("demo_interaction", { demo: demo.dataset.demo || window.location.pathname });
      }

      const link = target.closest<HTMLAnchorElement>("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") ?? "";
      const where =
        link.closest("[data-chapter]")?.getAttribute("data-chapter") ??
        link.closest("header, footer")?.tagName.toLowerCase() ??
        "page";

      if (href.startsWith("mailto:")) return track("email_click", { link_location: where });
      if (href.startsWith("tel:")) return track("phone_click", { link_location: where });
      if (/wa\.me|whatsapp\.com/.test(href)) return track("whatsapp_click", { link_location: where });

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (BOOKING_HOSTS.test(url.hostname + url.pathname)) return track("book_call_click", { link_location: where });
      if (url.origin === window.location.origin && url.pathname === "/start") {
        const focus = url.searchParams.get("focus");
        return track("start_project_click", {
          link_location: where,
          link_text: (link.textContent ?? "").trim().slice(0, 60),
          ...(focus ? { enquiry_focus: focus } : {}),
        });
      }
    };


    const onScroll = () => {
      if (scrolled.current) return;
      const h = document.documentElement;
      if (h.scrollHeight <= h.clientHeight) return;
      if ((h.scrollTop + h.clientHeight) / h.scrollHeight >= 0.9) {
        scrolled.current = true;
        track("scroll", { percent_scrolled: 90, page_path: window.location.pathname });
      }
    };

    document.addEventListener("click", onClick, { capture: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}
