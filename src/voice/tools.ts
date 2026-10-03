/**
 * WHAT VELA IS ALLOWED TO DO TO THE PAGE.
 *
 * The agent can move the site, but only along these rails. Every tool takes
 * enumerated values, and every value is checked here before anything
 * happens: an unknown destination is refused with a sentence the agent can
 * repeat, not attempted. There is no tool that takes a URL, a selector or
 * code, and none will be added.
 *
 * Pure: no React, no DOM. `parseToolCall` turns raw tool parameters into a
 * typed action or a refusal; the voice session executes the action. The
 * tests exercise this file directly.
 */

import { CAPABILITIES, type AreaId } from "../content/services";
import { FOCUS_OPTIONS, type Focus } from "../content/enquiry-flow";

/** navigate_site destinations → routes. */
export const DESTINATIONS = {
  home: "/",
  websites: "/website-conversion-systems",
  ai_systems: "/ai-systems",
  automations: "/lead-follow-up-systems",
  business_systems: "/business-systems",
  discoverability: "/website-engine-optimization",
  work: "/work",
  approach: "/approach",
  about: "/about",
  contact: "/start",
  privacy: "/privacy",
} as const;

/** scroll_to_section → homepage chapter ids. */
export const SECTIONS = {
  opening: "opening",
  capabilities: "capabilities",
  digital_experiences: "digital",
  ai_systems: "ai",
  automation: "automation",
  business_systems: "systems",
  work: "work",
  answers: "answers",
  contact: "contact",
} as const;

/** focus_service → capability area. */
export const SERVICE_AREAS = {
  digital_experiences: "digital",
  ai_systems: "ai",
  automation: "automation",
  business_systems: "systems",
} as const satisfies Record<string, Exclude<AreaId, "discover">>;

/** show_project → case study routes. Only published, legitimate work. */
export const PROJECTS = {
  cardio_life: "/work/cardio-life",
} as const;

export const CAPABILITY_IDS = CAPABILITIES.filter((c) => c.area !== "discover").map((c) => c.id);

export type Destination = keyof typeof DESTINATIONS;
export type Section = keyof typeof SECTIONS;
export type ServiceKey = keyof typeof SERVICE_AREAS;
export type Project = keyof typeof PROJECTS;

export type Action =
  | { kind: "navigate"; path: string; label: string }
  | { kind: "scroll"; section: string; label: string }
  | { kind: "focus"; area: AreaId; section: string; capability?: string; label: string }
  | { kind: "project"; path: string; label: string }
  | { kind: "contact"; focus?: Focus }
  | { kind: "prefill"; focus: Focus; message: string };

export type Parsed = { ok: true; action: Action } | { ok: false; message: string };

export const TOOL_NAMES = [
  "navigate_site",
  "scroll_to_section",
  "focus_service",
  "show_capability",
  "show_project",
  "open_contact",
  "prefill_enquiry",
] as const;
export type ToolName = (typeof TOOL_NAMES)[number];

const has = <T extends object>(table: T, key: unknown): key is keyof T =>
  typeof key === "string" && Object.prototype.hasOwnProperty.call(table, key);

const human = (key: string) => key.replace(/_/g, " ");

/** Plain text only: strips control characters and caps the length. */
export function cleanSummary(raw: unknown, max = 1200): string | null {
  if (typeof raw !== "string") return null;
  const text = raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  if (!text) return null;
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function areaSection(area: AreaId): string {
  return area === "discover" ? "digital" : area;
}

export function parseToolCall(name: string, params: unknown): Parsed {
  const p = (params && typeof params === "object" ? params : {}) as Record<string, unknown>;

  switch (name) {
    case "navigate_site": {
      if (!has(DESTINATIONS, p.destination)) {
        return { ok: false, message: `There is no page called "${String(p.destination)}". Available: ${Object.keys(DESTINATIONS).join(", ")}.` };
      }
      return { ok: true, action: { kind: "navigate", path: DESTINATIONS[p.destination], label: human(p.destination) } };
    }
    case "scroll_to_section": {
      if (!has(SECTIONS, p.section)) {
        return { ok: false, message: `There is no section called "${String(p.section)}".` };
      }
      return { ok: true, action: { kind: "scroll", section: SECTIONS[p.section], label: human(p.section) } };
    }
    case "focus_service": {
      if (!has(SERVICE_AREAS, p.service)) {
        return { ok: false, message: `"${String(p.service)}" is not one of the four capability areas.` };
      }
      const area = SERVICE_AREAS[p.service];
      return { ok: true, action: { kind: "focus", area, section: areaSection(area), label: human(p.service) } };
    }
    case "show_capability": {
      const cap = CAPABILITIES.find((c) => c.id === p.capability && c.area !== "discover");
      if (!cap) {
        return { ok: false, message: `"${String(p.capability)}" is not a capability VelaBuilt lists.` };
      }
      return {
        ok: true,
        action: { kind: "focus", area: cap.area, section: areaSection(cap.area), capability: cap.id, label: cap.name },
      };
    }
    case "show_project": {
      if (!has(PROJECTS, p.project)) {
        return { ok: false, message: `There is no published project called "${String(p.project)}". Only Cardio Life is published.` };
      }
      return { ok: true, action: { kind: "project", path: PROJECTS[p.project], label: human(p.project) } };
    }
    case "open_contact": {
      const focus = FOCUS_OPTIONS.includes(p.focus as Focus) ? (p.focus as Focus) : undefined;
      return { ok: true, action: { kind: "contact", focus } };
    }
    case "prefill_enquiry": {
      const focus = FOCUS_OPTIONS.includes(p.service as Focus) ? (p.service as Focus) : "not-sure";
      const message = cleanSummary(p.summary);
      if (!message) return { ok: false, message: "A summary is needed to prefill the enquiry." };
      return { ok: true, action: { kind: "prefill", focus, message } };
    }
    default:
      return { ok: false, message: `Unknown tool "${name}".` };
  }
}
