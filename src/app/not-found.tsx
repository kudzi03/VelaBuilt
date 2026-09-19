import Link from "next/link";
import type { Metadata } from "next";
import { primaryNav } from "@/content/site";
import { pageMetadata } from "@/lib/seo";
import { SignalStill } from "@/components/signal/SignalStill";
import { ArrowRight, Label } from "@/components/ui/Primitives";
import { Monogram } from "@/components/chrome/Monogram";

export const metadata: Metadata = pageMetadata({
  title: "Page not found",
  description: "That page does not exist.",
  path: "/404",
  noIndex: true,
});

export default function NotFound() {
  return (
    <>
      {/* The world: off the path, early. */}
      <SignalStill parked={0.18} />

      <section className="relative flex min-h-[100svh] items-center overflow-hidden py-32">

      <div className="shell relative">
        <Monogram
          className="h-12 w-auto text-[color:var(--color-champagne)]"
          title="VelaBuilt"
        />

        <Label tone="champagne" className="mt-12">
          404
        </Label>
        <h1 className="display-xl mt-5 max-w-[14ch]">
          Nothing here. <span className="foil">Yet.</span>
        </h1>
        <p className="lede mt-8 max-w-[42ch]">
          That page does not exist, or it has moved. Everything the site does have
          is one link away.
        </p>

        <nav aria-label="Site" className="mt-12">
          <ul className="flex flex-wrap gap-x-8 gap-y-4">
            {[{ label: "Home", href: "/" }, ...primaryNav].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="label transition-colors duration-400 hover:text-[color:var(--color-champagne)]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-12">
          <Link href="/" className="btn btn-ghost">
            <span>Back to the beginning</span>
            <ArrowRight />
          </Link>
        </div>
      </div>
    </section>
    </>
  );
}
