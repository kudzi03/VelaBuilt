"use client";

import { usePathname } from "next/navigation";
import { useVelaSnapshot } from "@/vela/store";
import { HOME_SEQUENCE } from "@/vela/chapters";

/**
 * The instrument strip along the bottom edge: where you are in the space,
 * and — on the opening — that there is more below. Decorative; the same
 * information is in the document's headings.
 */
export function Hud() {
  const { chapter, voiceOpen } = useVelaSnapshot();
  const pathname = usePathname();
  const i = pathname === "/" ? HOME_SEQUENCE.findIndex((c) => c.id === chapter) : -1;
  const at = HOME_SEQUENCE[i];

  return (
    <div className="hud" aria-hidden="true">
      <div className="shell flex h-16 items-center justify-between">
        <span className="w-24" />
        <span className="scroll-glyph" data-show={pathname === "/" && chapter === "opening" ? "" : undefined} />
        <p className="label hud__counter text-right" data-show={at && !voiceOpen ? "" : undefined}>
          {at ? (
            <>
              <span className="text-[color:var(--color-ivory)]">{String(i + 1).padStart(2, "0")}</span> /{" "}
              {String(HOME_SEQUENCE.length).padStart(2, "0")}
              <span className="ml-4 hidden sm:inline">{at.label}</span>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}
