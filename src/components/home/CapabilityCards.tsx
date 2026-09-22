import type { Service } from "@/content/services";
import { Reveal } from "@/components/ui/Reveal";

/**
 * The capability cards for one area. Each carries its stable id so Vela's
 * show_capability tool can light exactly this card — and nothing else.
 */
export function CapabilityCards({ service, headingLevel = "h3" }: { readonly service: Service; readonly headingLevel?: "h3" | "h4" }) {
  const H = headingLevel;
  return (
    <ul className="cap-grid" data-area={service.area}>
      {service.items.map((item, i) => (
        <Reveal as="li" key={item.id} delay={120 + i * 90} className="cap-card" >
          <div data-cap-id={item.id} className="contents">
            <span className="label" aria-hidden="true">
              {service.index}.{i + 1}
            </span>
            <H className="display-sm mt-3">{item.name}</H>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-[color:var(--color-muted)]">{item.body}</p>
          </div>
        </Reveal>
      ))}
    </ul>
  );
}
