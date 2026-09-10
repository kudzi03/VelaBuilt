import Link from "next/link";
import type { Crumb } from "@/lib/seo";

/**
 * Visible breadcrumbs, matching the BreadcrumbList emitted on the same page.
 * Structured data that describes navigation a visitor cannot see is a lie
 * told to a crawler, so the two are always built from the same array.
 */
export function Breadcrumbs({ crumbs }: { readonly crumbs: readonly Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-3">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.path} className="flex items-center gap-3">
              {isLast ? (
                <span className="label" aria-current="page">
                  {crumb.name}
                </span>
              ) : (
                <>
                  <Link
                    href={crumb.path}
                    className="label transition-colors duration-400 hover:text-[color:var(--color-champagne)]"
                  >
                    {crumb.name}
                  </Link>
                  <span aria-hidden="true" className="text-[color:var(--color-faint)]">
                    /
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
