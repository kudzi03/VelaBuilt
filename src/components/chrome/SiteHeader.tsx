"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { primaryNav } from "@/content/site";
import { Wordmark } from "./Monogram";
import { PhoneLink } from "./ContactLinks";
import { StartProjectLink } from "@/components/enquiry/StartProjectLink";

/**
 * Restrained persistent navigation. Transparent over the opening frame so the
 * hero reads full-bleed, then resolving into a graphite bar with a lit seam
 * once the visitor has left the first screen.
 */
export function SiteHeader() {
  const [settled, setSettled] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // The panel is open *for a route*. Navigating therefore closes it during
  // render, with no effect and no extra render pass.
  const [menu, setMenu] = useState({ open: false, path: pathname });
  const menuOpen = menu.open && menu.path === pathname;
  const setMenuOpen = useCallback(
    (open: boolean) => setMenu({ open, path: pathname }),
    [pathname],
  );

  useEffect(() => {
    const onScroll = () => setSettled(window.scrollY > 48);
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

  return (
    <header
      data-settled={settled}
      className="fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-700 data-[settled=true]:border-b data-[settled=true]:border-[color:var(--color-hairline)] data-[settled=true]:bg-[rgb(5_5_6/0.72)] data-[settled=true]:backdrop-blur-xl"
      style={{ ["--nav-height" as string]: "4.75rem" }}
    >
      <nav
        aria-label="Primary"
        className="shell flex h-[var(--nav-height)] items-center justify-between gap-8"
      >
        <Link
          href="/"
          className="shrink-0"
          aria-label={`VelaBuilt — home`}
        >
          <Wordmark />
        </Link>

        <ul className="hidden items-center gap-9 lg:flex">
          {primaryNav.map((item) => {
            const active =
              item.href.startsWith("/") &&
              !item.href.includes("#") &&
              pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="label relative py-2 transition-colors duration-500 hover:text-[color:var(--color-ivory)] aria-[current=page]:text-[color:var(--color-champagne)]"
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden lg:block">
          <PhoneLink className="label mr-8 transition-colors duration-500 hover:text-[color:var(--color-ivory)]" />
          <StartProjectLink variant="secondary" className="!py-3.5">
            Start a project
          </StartProjectLink>
        </div>

        <button
          ref={toggleRef}
          type="button"
          className="flex h-11 w-11 items-center justify-center border border-[color:var(--color-hairline-strong)] lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
          <span aria-hidden="true" className="relative block h-3 w-5">
            <span
              className="absolute inset-x-0 top-0 h-px bg-[color:var(--color-ivory)] transition-transform duration-500"
              style={{
                transform: menuOpen ? "translateY(6px) rotate(45deg)" : undefined,
              }}
            />
            <span
              className="absolute inset-x-0 top-1.5 h-px bg-[color:var(--color-ivory)] transition-opacity duration-300"
              style={{ opacity: menuOpen ? 0 : 1 }}
            />
            <span
              className="absolute inset-x-0 top-3 h-px bg-[color:var(--color-ivory)] transition-transform duration-500"
              style={{
                transform: menuOpen ? "translateY(-6px) rotate(-45deg)" : undefined,
              }}
            />
          </span>
        </button>
      </nav>

      {/* Mobile panel: a designed screen, not a squeezed desktop menu. */}
      <div
        id="mobile-nav"
        ref={panelRef}
        hidden={!menuOpen}
        className="fixed inset-0 top-[var(--nav-height)] z-40 bg-[color:var(--color-void)] lg:hidden"
      >
        <div className="horizon-field" aria-hidden="true">
          <span className="horizon-bloom" style={{ top: "78%" }} />
          <span className="horizon-line" style={{ top: "78%" }} />
        </div>

        <div className="relative flex h-full flex-col justify-between px-[var(--spacing-gutter)] pb-12 pt-10">
          <ul className="flex flex-col gap-1">
            {primaryNav.map((item, index) => (
              <li key={item.href} className="border-b border-[color:var(--color-hairline)]">
                <Link
                  href={item.href}
                  className="flex items-baseline gap-5 py-5"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="label label-champagne">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="display-sm text-[color:var(--color-ivory)]">
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-6">
            <StartProjectLink variant="primary" className="w-full justify-between">
              Start a project
            </StartProjectLink>
            <PhoneLink className="display-sm text-[color:var(--color-ivory)]" />
            <p className="label">Websites · Automation · AI Systems</p>
          </div>
        </div>
      </div>
    </header>
  );
}
