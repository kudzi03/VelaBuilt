"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { systemModules, type SystemId, type SystemModule } from "@/content/systems";
import { plateSource } from "@/content/scenes";
import { FlowChain } from "@/components/ui/FlowChain";
import { Label } from "@/components/ui/Primitives";
import { CORE, STATIONS, focusStation, labRoom } from "./labRoom";

/**
 * THE SYSTEM LAB.
 *
 * The signature interactive scene. Selecting a module does not swap a card —
 * the chamber reacts: the rest of the room falls into shadow, light travels
 * from the core out to the selected station, and the sequence that station
 * performs is drawn along it.
 *
 * The room is the supplied System Lab render. The stations sit exactly where
 * the architecture puts them, so a label is attached to a real object in a real
 * room rather than floating over a picture.
 *
 * What is preserved from the previous build, unchanged: the module data, the
 * connection model, the oversight statements, keyboard operation, and the fact
 * that everything visible here is structure — there is no customer data in this
 * demonstration, real or invented.
 */

export function SystemLabRoom({
  initialId = "crm",
  /** True when this instance owns the page's cinematic backdrop. */
  drivesBackdrop = false,
}: {
  readonly initialId?: SystemId;
  readonly drivesBackdrop?: boolean;
}) {
  const [selected, setSelected] = useState<SystemId>(initialId);
  const [hovered, setHovered] = useState<SystemId | null>(null);
  const gradientId = useId();
  const roomRef = useRef<HTMLDivElement>(null);

  const activeId = hovered ?? selected;
  const active = useMemo(
    () => systemModules.find((unit) => unit.id === activeId)!,
    [activeId],
  );
  const connected = useMemo(() => new Set<SystemId>(active.connects), [active]);

  // Tell the compositor where to hold the light. Only the instance that owns
  // the backdrop does this, so two labs on one page cannot fight over the room.
  useEffect(() => {
    if (!drivesBackdrop) return;
    focusStation(activeId);
    return () => focusStation(null);
  }, [activeId, drivesBackdrop]);

  useEffect(() => {
    if (!drivesBackdrop) return;
    return () => {
      labRoom.active = false;
    };
  }, [drivesBackdrop]);

  const room = plateSource("system-lab");
  const activeStation = STATIONS[activeId];

  return (
    <div>
      <div
        ref={roomRef}
        className="relative overflow-hidden border border-[color:var(--color-hairline)]"
        style={{ aspectRatio: "1672 / 941" }}
      >
        {/* The chamber. */}
        <picture>
          <source type="image/avif" srcSet={room.avifSrcSet} sizes="(min-width: 1024px) 80vw, 100vw" />
          <source type="image/webp" srcSet={room.webpSrcSet} sizes="(min-width: 1024px) 80vw, 100vw" />
          <img
            src={room.webp}
            alt="The VelaBuilt System Lab: a circular chamber with a suspended core at its center and glass stations around the perimeter."
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </picture>

        {/* The room falls into shadow away from the selected chain. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 transition-[background] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
          style={{
            background: `radial-gradient(38% 54% at ${activeStation[0] * 100}% ${activeStation[1] * 100}%, rgb(4 4 5 / 0) 0%, rgb(4 4 5 / 0.28) 34%, rgb(4 4 5 / 0.68) 66%, rgb(4 4 5 / 0.86) 100%)`,
          }}
        />

        {/* Light travelling from the core out to the selected station, and on
            to everything it hands off to. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id={`${gradientId}-live`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgb(224 195 152 / 0)" />
              <stop offset="45%" stopColor="rgb(240 220 186 / 0.95)" />
              <stop offset="100%" stopColor="rgb(224 195 152 / 0.25)" />
            </linearGradient>
          </defs>

          {/* Core → active station. */}
          <line
            x1={CORE[0] * 100}
            y1={CORE[1] * 100}
            x2={activeStation[0] * 100}
            y2={activeStation[1] * 100}
            stroke={`url(#${gradientId}-live)`}
            strokeWidth="1.4"
            vectorEffect="non-scaling-stroke"
            className="lab-thread"
          />

          {/* Active station → each system it connects to. */}
          {active.connects.map((id) => {
            const target = STATIONS[id];
            if (!target) return null;
            return (
              <line
                key={id}
                x1={activeStation[0] * 100}
                y1={activeStation[1] * 100}
                x2={target[0] * 100}
                y2={target[1] * 100}
                stroke="rgb(224 195 152 / 0.5)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                className="lab-thread lab-thread--secondary"
              />
            );
          })}
        </svg>

        {/* The stations. Buttons on the architecture, not cards over it. */}
        <ul className="absolute inset-0">
          {systemModules.map((unit) => {
            const station = STATIONS[unit.id];
            const isActive = unit.id === activeId;
            const isConnected = connected.has(unit.id);

            return (
              <li
                key={unit.id}
                className="absolute"
                style={{
                  left: `${station[0] * 100}%`,
                  top: `${station[1] * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <button
                  type="button"
                  aria-pressed={unit.id === selected}
                  aria-describedby="system-detail"
                  data-state={isActive ? "active" : isConnected ? "connected" : "idle"}
                  data-side={station[0] > 0.55 ? "right" : "left"}
                  onClick={() => setSelected(unit.id)}
                  onMouseEnter={() => setHovered(unit.id)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(unit.id)}
                  onBlur={() => setHovered(null)}
                  className="lab-station"
                >
                  <span aria-hidden="true" className="lab-station__node" />
                  <span className="lab-station__name">{unit.name}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* The chamber's own signage, as HTML — never baked into the image.
            It sits on the floor of a photograph, so it carries its own
            shadow: solid (90%) under the text line, falling away above it. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 bg-[linear-gradient(0deg,rgb(5_5_6/0.9)_0%,rgb(5_5_6/0.9)_78%,rgb(5_5_6/0)_100%)] p-5 sm:p-7">
          <Label className="!text-[0.78rem]">Structure only · no customer data</Label>
          <Label tone="champagne" className="!text-[0.78rem]">
            {active.name}
          </Label>
        </div>
      </div>

      {/* The room's controls, for viewports where labels cannot live inside
          it. Same buttons, same state, legible size. */}
      <ul className="mt-px flex snap-x snap-mandatory gap-px overflow-x-auto bg-[color:var(--color-hairline)] lg:hidden">
        {systemModules.map((unit) => {
          const isActive = unit.id === activeId;
          return (
            <li key={unit.id} className="snap-start">
              <button
                type="button"
                aria-pressed={unit.id === selected}
                aria-describedby="system-detail"
                data-state={isActive ? "active" : "idle"}
                onClick={() => setSelected(unit.id)}
                className="flex h-full w-full items-center whitespace-nowrap bg-[color:var(--color-obsidian)] px-5 py-4 text-[0.78rem] uppercase tracking-[0.18em] text-[color:var(--color-muted)] transition-colors duration-500 data-[state=active]:bg-[color:var(--color-graphite-raised)] data-[state=active]:text-[color:var(--color-champagne)]"
              >
                {unit.name}
              </button>
            </li>
          );
        })}
      </ul>

      <LabDetail active={active} onSelect={setSelected} />
    </div>
  );
}

function LabDetail({
  active,
  onSelect,
}: {
  readonly active: SystemModule;
  readonly onSelect: (id: SystemId) => void;
}) {
  return (
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
                  onClick={() => onSelect(id)}
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
  );
}
