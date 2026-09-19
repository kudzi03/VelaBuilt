import type { Gate } from "@/content/signal-path";
import { Label } from "@/components/ui/Primitives";
import { Reveal } from "@/components/ui/Reveal";

/**
 * One stage of the system, as words.
 *
 * The scene behind this is travelling past the matching gate as the section
 * scrolls, so the copy is deliberately short: the visitor is watching
 * something, and a paragraph would ask them to stop. Everything that needs
 * explaining in full is on the service pages.
 *
 * The blocks alternate sides to follow the path's own lateral drift, so the
 * type sits in the frame the camera leaves empty rather than fighting the
 * gate for the middle of the screen.
 */
export function GateBeat({
  gate,
  index,
  total,
}: {
  readonly gate: Gate;
  readonly index: number;
  readonly total: number;
}) {
  // Gates drift left, right, left… The copy takes the opposite side.
  const onRight = index % 2 === 0;

  return (
    <section
      id={gate.id}
      aria-labelledby={`${gate.id}-heading`}
      data-gate={index}
      className="relative flex min-h-[100svh] flex-col justify-center py-24"
    >
      <div className="shell w-full">
        <div className={onRight ? "flex justify-end" : "flex justify-start"}>
          <Reveal className="on-plate max-w-[34ch]">
            <Label tone="champagne" as="span">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </Label>
            <h2 id={`${gate.id}-heading`} className="display-md mt-5">
              {gate.label}
            </h2>
            <p className="lede mt-5 text-[color:var(--color-ivory-dim)]">{gate.note}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
