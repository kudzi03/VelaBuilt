import { CHAPTERS } from "@/lib/journey";
import { getService } from "@/content/services";
import { ChapterFrame } from "./ChapterFrame";
import { OfferBody } from "./OfferBody";
import { Reveal } from "@/components/ui/Reveal";
import { Label } from "@/components/ui/Primitives";

const chapter = CHAPTERS[4]!;
const service = getService("website-engine-optimization");

/** Everything that has to be able to read a business correctly. */
const SURFACES = [
  { name: "Search", body: "Indexed, structured, and matched to what people actually ask." },
  { name: "Maps & local", body: "Consistent details wherever the business is listed." },
  { name: "Answer engines", body: "Enough structure that an AI can describe you accurately." },
  { name: "The site itself", body: "Information architecture a person can navigate without help." },
] as const;

export function SceneDiscoverability() {
  return (
    <ChapterFrame
      chapter={chapter}
      id="discoverability"
      headingId="discoverability-heading"
    >
      <Reveal>
        <h2 id="discoverability-heading" className="display-lg max-w-[20ch]">
          {service.headline[0]}
          <span className="mt-3 block">
            <span className="foil">{service.headline[1]}</span>
          </span>
        </h2>
      </Reveal>

      <OfferBody service={service} focus="discoverability">
        <div className="panel p-8">
          <Label tone="champagne">What has to understand you</Label>
          <ul className="mt-6 flex flex-col gap-5">
            {SURFACES.map((surface) => (
              <li key={surface.name} className="border-b border-[color:var(--color-hairline)] pb-4 last:border-0 last:pb-0">
                <p className="text-[0.98rem] text-[color:var(--color-ivory)]">
                  {surface.name}
                </p>
                <p className="mt-1.5 text-sm text-[color:var(--color-muted)]">
                  {surface.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </OfferBody>
    </ChapterFrame>
  );
}
