/**
 * SYSTEM LAB — interactive system demonstrations.
 *
 * Each module is a real component of a delivered follow-up system, described
 * in buyer language with the flow it performs and the modules it talks to.
 * The room is driven entirely by this data: selecting a module lights its
 * connections. Sample values are illustrative and labelled as such — nothing
 * here is real customer data.
 */

export type SystemId =
  | "crm"
  | "booking"
  | "follow-up"
  | "email"
  | "messaging"
  | "pipeline"
  | "calendar"
  | "ai"
  | "data"
  | "analytics";

export interface SystemModule {
  readonly id: SystemId;
  readonly name: string;
  /** One line. What it does for the business, not what the software is. */
  readonly role: string;
  /** The sequence this module performs, in order. */
  readonly flow: readonly string[];
  /** Modules this one hands off to or reads from. */
  readonly connects: readonly SystemId[];
  /** What a person still decides. Stated for every module that can act. */
  readonly oversight: string;
  /** Grid position in the lab room: [column, row] on a 5×2 field. */
  readonly cell: readonly [number, number];
}

export const systemModules: readonly SystemModule[] = [
  {
    id: "crm",
    name: "CRM",
    role: "Every inquiry becomes a record instead of a memory.",
    flow: ["Inquiry", "Contact", "Company", "Opportunity", "Task", "Follow-up"],
    connects: ["data", "pipeline", "follow-up", "analytics"],
    oversight: "You decide what qualifies as an opportunity worth pursuing.",
    cell: [0, 0],
  },
  {
    id: "booking",
    name: "Booking",
    role: "The right conversations reach the calendar without a scheduling thread.",
    flow: ["Lead", "Qualification", "Availability", "Booking", "Calendar", "Confirmation"],
    connects: ["calendar", "crm", "messaging", "email"],
    oversight: "You set who is allowed to book, when, and for how long.",
    cell: [1, 0],
  },
  {
    id: "follow-up",
    name: "Follow-up",
    role: "Nothing goes quiet because the week got busy.",
    flow: ["Trigger", "Wait", "Message", "Reminder", "Escalate", "Stop on reply"],
    connects: ["email", "messaging", "crm", "ai"],
    oversight: "Sequences stop the moment a human replies. You approve every message template.",
    cell: [2, 0],
  },
  {
    id: "email",
    name: "Email",
    role: "Replies that sound like the business, sent on time.",
    flow: ["Draft", "Personalize", "Send", "Track", "Reply detection"],
    connects: ["follow-up", "crm", "ai"],
    oversight: "Templates are yours. Anything unusual is drafted for a person to send.",
    cell: [3, 0],
  },
  {
    id: "messaging",
    name: "Messaging",
    role: "Reaching people where they actually answer.",
    flow: ["Channel", "Consent", "Message", "Response", "Handover"],
    connects: ["follow-up", "booking", "crm"],
    oversight: "Consent is checked before a channel is used. Conversations hand over to a person on request.",
    cell: [4, 0],
  },
  {
    id: "pipeline",
    name: "Pipeline",
    role: "One view of every open opportunity and what it is waiting on.",
    flow: ["New", "Qualified", "Quoted", "Following up", "Booked", "Closed"],
    connects: ["crm", "analytics", "data"],
    oversight: "Stages match how the business actually sells, not a template.",
    cell: [0, 1],
  },
  {
    id: "calendar",
    name: "Calendar",
    role: "Availability that reflects reality, including the days you are on site.",
    flow: ["Availability rules", "Buffers", "Hold", "Confirm", "Reminders"],
    connects: ["booking", "crm", "email"],
    oversight: "Your working hours and buffers govern everything the system offers.",
    cell: [1, 1],
  },
  {
    id: "ai",
    name: "AI Assistance",
    role: "Reads, classifies and drafts — where a person would otherwise retype.",
    flow: [
      "Conversation",
      "Understanding",
      "Classification",
      "Useful draft or action",
      "Human oversight",
    ],
    connects: ["email", "follow-up", "crm", "data"],
    oversight:
      "AI proposes; a person decides on anything that commits the business. Escalation is the default when confidence is low.",
    cell: [2, 1],
  },
  {
    id: "data",
    name: "Business Data",
    role: "The record of what the business knows, in one structured place.",
    flow: ["Capture", "Validate", "Store", "Relate", "Retrieve"],
    connects: ["crm", "pipeline", "analytics", "ai"],
    oversight: "You own the data and can export all of it at any time.",
    cell: [3, 1],
  },
  {
    id: "analytics",
    name: "Analytics",
    role: "What came in, what was answered, what was booked.",
    flow: ["Event", "Attribution", "Aggregation", "Report", "Decision"],
    connects: ["crm", "pipeline", "data"],
    oversight: "Measurement is configured for decisions you actually make.",
    cell: [4, 1],
  },
] as const;

export function getSystem(id: SystemId): SystemModule {
  const found = systemModules.find((module) => module.id === id);
  if (!found) throw new Error(`Unknown system module: ${id}`);
  return found;
}
