import { CHAPTERS } from "@/lib/journey";
import { getService } from "@/content/services";
import { ChapterFrame } from "./ChapterFrame";
import { OfferBody } from "./OfferBody";
import { Reveal } from "@/components/ui/Reveal";

const chapter = CHAPTERS[1]!;
const service = getService("website-conversion-systems");

export function SceneWebsite() {
  return (
    <ChapterFrame chapter={chapter} id="website" headingId="website-heading">
      <Reveal>
        <h2 id="website-heading" className="display-lg max-w-[18ch]">
          {service.headline[0]}
          <span className="mt-3 block">
            <span className="foil">{service.headline[1]}</span>
          </span>
        </h2>
      </Reveal>

      <OfferBody service={service} focus="website">
        {/* The argument a good site makes, in the order it makes it. */}
        <div className="panel p-8">
          <p className="label label-champagne">The path a visitor takes</p>
          <ol className="mt-6 flex flex-col gap-5">
            {[
              { step: "Arrive", body: "In two seconds: what this is, and whether it is for them." },
              { step: "Believe", body: "Evidence that the business can do the work." },
              { step: "Understand", body: "What is actually being offered, without decoding it." },
              { step: "Act", body: "One obvious next step, available on every screen." },
            ].map((item, index) => (
              <li key={item.step} className="flex gap-5">
                <span className="label label-champagne shrink-0 pt-1">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="block text-[0.98rem] text-[color:var(--color-ivory)]">
                    {item.step}
                  </span>
                  <span className="mt-1 block text-sm text-[color:var(--color-muted)]">
                    {item.body}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </OfferBody>
    </ChapterFrame>
  );
}
