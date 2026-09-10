import { CHAPTERS } from "@/lib/journey";
import { site } from "@/content/site";
import { ChapterFrame } from "./ChapterFrame";
import { Reveal } from "@/components/ui/Reveal";
import { Monogram } from "@/components/chrome/Monogram";
import { StartProjectLink } from "@/components/enquiry/StartProjectLink";
import { Label } from "@/components/ui/Primitives";

const chapter = CHAPTERS[5]!;

export function SceneDestination() {
  return (
    <ChapterFrame chapter={chapter} id="destination" headingId="destination-heading">
      <div className="flex flex-col items-center text-center">
        <Reveal>
          <Monogram
            className="mx-auto h-14 w-auto text-[color:var(--color-champagne)]"
            title="VelaBuilt"
          />
        </Reveal>

        <Reveal delay={100}>
          <h2 id="destination-heading" className="display-xl mt-12 max-w-[14ch]">
            A more capable <span className="foil">business.</span>
          </h2>
        </Reveal>

        <Reveal delay={180}>
          <p className="lede mt-8 max-w-[46ch]">
            The website, the follow-up and the foundations underneath, built as one
            thing — so the business runs without being carried.
          </p>
        </Reveal>

        <Reveal delay={260}>
          <span aria-hidden="true" className="seam mt-12 block w-40" />
          <Label className="mt-8">{site.capabilities.join(" · ")}</Label>
        </Reveal>

        <Reveal delay={340}>
          <div className="mt-10">
            <StartProjectLink variant="primary">Build with VelaBuilt</StartProjectLink>
          </div>
        </Reveal>
      </div>
    </ChapterFrame>
  );
}
