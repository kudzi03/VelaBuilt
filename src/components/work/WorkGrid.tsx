import Link from "next/link";
import {
  workCategories,
  type WorkItem,
} from "@/content/work";
import { ArrowRight, CategoryBadge, Label } from "@/components/ui/Primitives";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Work, with its claim attached.
 *
 * The category badge on every card is load-bearing: it says whether the piece
 * was delivered for a client, is a study, or is a demonstration on sample data.
 * Nothing is shown without one.
 */
export function WorkGrid({ items }: { readonly items: readonly WorkItem[] }) {
  return (
    <ul className="grid gap-px bg-[color:var(--color-hairline)] md:grid-cols-2">
      {items.map((item, index) => {
        const category = workCategories.find((entry) => entry.id === item.category)!;
        const inner = (
          <>
            <div>
              <CategoryBadge tone={item.category === "client-work" ? "champagne" : "neutral"}>
                {category.label}
              </CategoryBadge>
              <h3 className="display-md mt-6">{item.title}</h3>

              <div className="mt-7">
                <Label>The problem</Label>
                <p className="mt-2.5 max-w-[46ch] text-sm leading-relaxed text-[color:var(--color-ivory-dim)]">
                  {item.problem}
                </p>
              </div>

              <div className="mt-6">
                <Label>The response</Label>
                <p className="mt-2.5 max-w-[46ch] text-sm leading-relaxed text-[color:var(--color-muted)]">
                  {item.response}
                </p>
              </div>
            </div>

            <div className="mt-9">
              <ul className="flex flex-wrap gap-2">
                {item.disciplines.map((discipline) => (
                  <li
                    key={discipline}
                    className="border border-[color:var(--color-hairline)] px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.2em] text-[color:var(--color-faint)]"
                  >
                    {discipline}
                  </li>
                ))}
              </ul>

              {item.href ? (
                <span className="label label-champagne mt-7 inline-flex items-center gap-3">
                  Open the demonstration
                  <ArrowRight className="transition-transform duration-500 group-hover:translate-x-1.5" />
                </span>
              ) : null}
            </div>
          </>
        );

        return (
          <Reveal as="li" key={item.slug} delay={index * 90}>
            {item.href ? (
              <Link
                href={item.href}
                className="panel panel-interactive group flex h-full flex-col justify-between !border-0 p-8 lg:p-10"
              >
                {inner}
              </Link>
            ) : (
              <div className="panel flex h-full flex-col justify-between !border-0 p-8 lg:p-10">
                {inner}
              </div>
            )}
          </Reveal>
        );
      })}
    </ul>
  );
}

/** The definitions, stated wherever work is shown. */
export function WorkCategoryKey() {
  return (
    <dl className="grid gap-8 sm:grid-cols-3">
      {workCategories.map((category) => (
        <div key={category.id}>
          <dt>
            <CategoryBadge tone={category.id === "client-work" ? "champagne" : "neutral"}>
              {category.label}
            </CategoryBadge>
          </dt>
          <dd className="mt-4 text-sm leading-relaxed text-[color:var(--color-muted)]">
            {category.definition}
          </dd>
        </div>
      ))}
    </dl>
  );
}
