import { CHAPTERS } from "@/lib/journey";
import { getService } from "@/content/services";
import { ChapterFrame } from "./ChapterFrame";
import { OfferBody } from "./OfferBody";
import { Reveal } from "@/components/ui/Reveal";
import { FlowChain } from "@/components/ui/FlowChain";
import { Label } from "@/components/ui/Primitives";

const chapter = CHAPTERS[2]!;
const service = getService("lead-follow-up-systems");

/** What should happen, in order, once an enquiry exists. */
const CHAIN = [
  "Enquiry",
  "CRM",
  "Qualification",
  "Follow-up",
  "Reply",
  "Booking",
  "Calendar",
] as const;

export function SceneEnquiry() {
  return (
    <ChapterFrame chapter={chapter} id="enquiry" headingId="enquiry-heading">
      <Reveal>
        <h2 id="enquiry-heading" className="display-lg">
          {service.headline[0]}
          <span className="mt-3 block text-[color:var(--color-muted)]">
            {service.headline[1]}
          </span>
        </h2>
      </Reveal>

      <Reveal delay={120}>
        <div className="mt-12 grid gap-px border border-[color:var(--color-hairline)] bg-[color:var(--color-hairline)] sm:grid-cols-2">
          <div className="bg-[color:var(--color-obsidian)] p-8">
            <Label>Without a system</Label>
            <p className="mt-5 text-[0.98rem] leading-relaxed text-[color:var(--color-ivory-dim)]">
              It arrives on a Friday afternoon. It is read on a phone, on site,
              between two jobs. It is remembered on Tuesday — or it isn&rsquo;t.
            </p>
            <ul className="mt-7 flex flex-wrap gap-2">
              {["Inbox", "Then nothing"].map((item) => (
                <li
                  key={item}
                  className="border border-[color:var(--color-hairline)] px-3 py-1.5 text-[0.75rem] uppercase tracking-[0.2em] text-[color:var(--color-faint)]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[color:var(--color-obsidian)] p-8">
            <Label tone="champagne">With one</Label>
            <p className="mt-5 text-[0.98rem] leading-relaxed text-[color:var(--color-ivory-dim)]">
              The same enquiry is captured, recorded, qualified, answered and
              followed up on a schedule — and stops the moment a person replies.
            </p>
            <FlowChain steps={CHAIN} className="mt-7" />
          </div>
        </div>
      </Reveal>

      <OfferBody service={service} focus="follow-up" />
    </ChapterFrame>
  );
}
