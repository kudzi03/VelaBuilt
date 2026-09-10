"use client";

import { useMemo, useState } from "react";
import { systemModules, type SystemId, type SystemModule } from "@/content/systems";
import { FlowChain } from "@/components/ui/FlowChain";
import { Label } from "@/components/ui/Primitives";

/**
 * INTERACTIVE SYSTEM DEMONSTRATIONS.
 *
 * A room of modules rather than a services grid. Selecting one lights the
 * modules it hands off to and shows the sequence it performs, because the
 * thing businesses are never shown is how the parts relate.
 *
 * Honesty: the flows are the flows we build, and every module states what a
 * person still decides. Nothing here is presented as live customer data —
 * there is no data here at all, only structure.
 *
 * Accessibility: the modules are buttons in a list, reachable and operable by
 * keyboard, with hover and focus treated identically. The connection lines are
 * decorative and hidden from assistive technology; the same relationships are
 * listed as text in the detail panel, which is where narrow screens read them.
 */

const COLUMNS = 5;
const ROWS = 2;

export function SystemLab({ initialId = "crm" }: { readonly initialId?: SystemId }) {
  const [selected, setSelected] = useState<SystemId>(initialId);
  const [hovered, setHovered] = useState<SystemId | null>(null);

  const activeId = hovered ?? selected;
  const active = useMemo(
    () => systemModules.find((unit) => unit.id === activeId)!,
    [activeId],
  );

  const connected = useMemo(() => new Set<SystemId>(active.connects), [active]);

  const connections = useMemo(() => {
    const centre = (unit: SystemModule) => ({
      x: ((unit.cell[0] + 0.5) / COLUMNS) * 100,
      y: ((unit.cell[1] + 0.5) / ROWS) * 100,
    });
    const from = centre(active);
    return active.connects
      .map((id) => systemModules.find((unit) => unit.id === id))
      .filter((unit): unit is SystemModule => Boolean(unit))
      .map((unit) => ({ id: unit.id, from, to: centre(unit) }));
  }, [active]);

  return (
    <div>
      <div className="relative">
        {/* Handoffs, drawn between the modules they connect. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
        >
          {connections.map((connection) => (
            <line
              key={connection.id}
              x1={connection.from.x}
              y1={connection.from.y}
              x2={connection.to.x}
              y2={connection.to.y}
              stroke="rgb(224 195 152 / 0.42)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        <ul className="relative grid grid-cols-2 gap-px bg-[color:var(--color-hairline)] sm:grid-cols-3 lg:grid-cols-5">
          {systemModules.map((unit) => {
            const isActive = unit.id === activeId;
            const isConnected = connected.has(unit.id);
            return (
              <li key={unit.id}>
                <button
                  type="button"
                  id={`system-${unit.id}`}
                  aria-pressed={unit.id === selected}
                  aria-describedby="system-detail"
                  data-state={isActive ? "active" : isConnected ? "connected" : "idle"}
                  onClick={() => setSelected(unit.id)}
                  onMouseEnter={() => setHovered(unit.id)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(unit.id)}
                  onBlur={() => setHovered(null)}
                  className="group relative flex h-full w-full flex-col items-start gap-2 bg-[color:var(--color-obsidian)] px-5 py-7 text-left transition-colors duration-500 data-[state=active]:bg-[color:var(--color-graphite-raised)] data-[state=connected]:bg-[rgb(20_20_24/0.85)]"
                >
                  <span
                    aria-hidden="true"
                    data-state={isActive ? "active" : isConnected ? "connected" : "idle"}
                    className="absolute inset-x-0 top-0 h-px bg-transparent transition-colors duration-500 data-[state=active]:bg-[color:var(--color-champagne)] data-[state=connected]:bg-[rgb(224_195_152/0.35)]"
                  />
                  <span
                    data-state={isActive ? "active" : isConnected ? "connected" : "idle"}
                    className="text-[0.95rem] leading-tight text-[color:var(--color-muted)] transition-colors duration-500 data-[state=active]:text-[color:var(--color-champagne)] data-[state=connected]:text-[color:var(--color-ivory)]"
                  >
                    {unit.name}
                  </span>
                  <span className="text-[0.78rem] leading-relaxed text-[color:var(--color-faint)]">
                    {unit.flow.length} steps
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* The detail panel. Announced when the selection changes. */}
      <div
        id="system-detail"
        aria-live="polite"
        className="panel mt-px grid gap-10 p-8 lg:grid-cols-[1.15fr_1fr] lg:p-10"
      >
        <div>
          <Label tone="champagne">{active.name}</Label>
          <p className="display-sm mt-4 max-w-[30ch] text-[color:var(--color-ivory)]">
            {active.role}
          </p>

          <div className="mt-8">
            <Label>The sequence</Label>
            <FlowChain steps={active.flow} className="mt-4" />
          </div>
        </div>

        <div>
          <Label>Connects to</Label>
          <ul className="mt-4 flex flex-wrap gap-2">
            {active.connects.map((id) => {
              const unit = systemModules.find((entry) => entry.id === id);
              if (!unit) return null;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setSelected(id)}
                    className="border border-[color:var(--color-hairline-strong)] px-3 py-1.5 text-[0.75rem] uppercase tracking-[0.2em] text-[color:var(--color-ivory-dim)] transition-colors duration-400 hover:border-[rgb(224_195_152/0.5)] hover:text-[color:var(--color-champagne)]"
                  >
                    {unit.name}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 border-t border-[color:var(--color-hairline)] pt-6">
            <Label>What a person still decides</Label>
            <p className="mt-3 max-w-[44ch] text-sm leading-relaxed text-[color:var(--color-muted)]">
              {active.oversight}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
