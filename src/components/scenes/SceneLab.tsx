import Link from "next/link";
import { CHAPTERS } from "@/lib/journey";
import { ChapterFrame } from "./ChapterFrame";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowRight, CategoryBadge } from "@/components/ui/Primitives";

const chapter = CHAPTERS[3]!;

export function SceneLab() {
  return (
    <ChapterFrame chapter={chapter} id="lab" headingId="lab-heading">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <CategoryBadge tone="champagne">Interactive system demonstrations</CategoryBadge>
            <h2 id="lab-heading" className="display-lg mt-6 max-w-[16ch]">
              The room where the parts meet.
            </h2>
          </div>

          <p className="max-w-[42ch] text-sm leading-relaxed text-[color:var(--color-muted)]">
            Select a system to see what it does, what it hands off to, and what a
            person still decides. Structure only — no customer data appears here.
          </p>
        </div>
      </Reveal>

      {/* A teaser, not a second copy of the room. The full lab is one click
          away and renders the same modules interactively. */}
      <Reveal delay={140} className="mt-12">
        <ul className="flex flex-wrap gap-2">
          {[
            "Website",
            "CRM",
            "Follow-up",
            "Booking",
            "AI assistant",
            "Analytics",
          ].map((module) => (
            <li
              key={module}
              className="border border-[color:var(--color-hairline)] px-4 py-2 text-[0.75rem] uppercase tracking-[0.2em] text-[color:var(--color-faint)]"
            >
              {module}
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal delay={200} className="mt-10">
        <Link href="/system-lab" className="btn btn-primary">
          <span className="inline-flex items-center gap-3">
            Open the System Lab
            <ArrowRight />
          </span>
        </Link>
      </Reveal>
    </ChapterFrame>
  );
}
