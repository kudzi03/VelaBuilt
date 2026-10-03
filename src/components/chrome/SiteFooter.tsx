import Link from "next/link";
import { footerNav, site, disclosures } from "@/content/site";
import { Label } from "@/components/ui/Primitives";
import { StartProjectLink } from "@/components/enquiry/StartProjectLink";
import { Wordmark } from "./Monogram";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="sheet" data-chapter="reading">
      <div className="shell py-20 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Link href="/" className="inline-flex" aria-label="VelaBuilt — home">
              <Wordmark />
            </Link>

            <p className="display-md mt-8 max-w-[18ch]">{site.tagline}</p>
            <p className="mt-4 max-w-[42ch] text-sm leading-relaxed text-[color:var(--color-muted)]">
              {site.shortDescription}
            </p>

            <Label className="mt-10">
              {site.capabilities.join(" · ")}
            </Label>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {footerNav.map((column) => (
              <nav key={column.heading} aria-label={column.heading}>
                {/* Not a heading: these name link groups, and the <nav>
                    landmark already carries the same name for screen readers.
                    As <h2>s they put three "Solutions/Studio/Contact" entries
                    at the top level of every page's outline. */}
                <Label className="mb-6">
                  {column.heading}
                </Label>
                <ul className="flex flex-col gap-3.5">
                  {column.links.map((link) => {
                    const external = link.href.startsWith("http");
                    const mail = /^(mailto|tel):/.test(link.href);
                    const className =
                      "text-sm text-[color:var(--color-ivory-dim)] transition-colors duration-400 hover:text-[color:var(--color-ivory)] underline-offset-4 hover:underline";
                    return (
                      <li key={link.href}>
                        {link.href === "/start" ? (
                          // The inquiry opens in place here too, as it does
                          // from every other "Start a project" on the site.
                          <StartProjectLink variant="plain" className={className}>
                            {link.label}
                          </StartProjectLink>
                        ) : external || mail ? (
                          <a
                            href={link.href}
                            className={className}
                            rel={external ? "noopener noreferrer me" : undefined}
                            target={external ? "_blank" : undefined}
                          >
                            {link.label}
                          </a>
                        ) : (
                          <Link href={link.href} className={className}>
                            {link.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* What we do not claim, stated where anyone can read it. */}
        <div className="mt-20 border-t border-[color:var(--color-hairline)] pt-10">
          <Label className="mb-5">What this site does not claim</Label>
          <ul className="grid gap-2.5 text-sm text-[color:var(--color-faint)] sm:grid-cols-2">
            {disclosures.map((line) => (
              <li key={line} className="flex gap-3">
                <span aria-hidden="true" className="mt-2.5 h-px w-3 shrink-0 bg-[color:var(--color-hairline-strong)]" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-[color:var(--color-hairline)] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="label">© {year} {site.name}</p>
          <p className="label">Designed and engineered by VelaBuilt</p>
        </div>
      </div>
    </footer>
  );
}
