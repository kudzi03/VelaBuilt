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
    name: "Customers",
    role: "Every inquiry becomes a record instead of a memory.",
    flow: ["Enquiry", "Person", "Company", "Possible work", "Next step", "Follow-up"],
    connects: ["data", "pipeline", "follow-up", "analytics"],
    oversight: "You decide which enquiries are worth pursuing.",
    cell: [0, 0],
  },
  {
    id: "booking",
    name: "Booking",
    role: "People can book the right conversation without a long email exchange.",
    flow: ["Enquiry", "Check the request", "Free time", "Booking", "Calendar", "Confirmation"],
    connects: ["calendar", "crm", "messaging", "email"],
    oversight: "You set who is allowed to book, when, and for how long.",
    cell: [1, 0],
  },
  {
    id: "follow-up",
    name: "Follow-up",
    role: "Nothing goes quiet because the week got busy.",
    flow: ["Enquiry arrives", "Wait", "Message", "Reminder", "Ask a person", "Stop on reply"],
    connects: ["email", "messaging", "crm", "ai"],
    oversight: "Messages stop when someone replies. You approve the wording before anything is sent.",
    cell: [2, 0],
  },
  {
    id: "email",
    name: "Email",
    role: "Replies that sound like the business, sent on time.",
    flow: ["Draft", "Make it personal", "Send", "Track", "Notice a reply"],
    connects: ["follow-up", "crm", "ai"],
    oversight: "You approve the messages. Unusual replies go to a person on your team.",
    cell: [3, 0],
  },
  {
    id: "messaging",
    name: "Messaging",
    role: "Reaching people where they actually answer.",
    flow: ["Choose a channel", "Check permission", "Message", "Reply", "Hand over"],
    connects: ["follow-up", "booking", "crm"],
    oversight: "We check that someone agreed to be contacted. They can ask to speak to a person.",
    cell: [4, 0],
  },
  {
    id: "pipeline",
    name: "Open work",
    role: "One view of every open opportunity and what it is waiting on.",
    flow: ["New", "Reviewed", "Quoted", "Following up", "Booked", "Finished"],
    connects: ["crm", "analytics", "data"],
    oversight: "The steps match how your business actually sells.",
    cell: [0, 1],
  },
  {
    id: "calendar",
    name: "Calendar",
    role: "Availability that reflects reality, including the days you are on site.",
    flow: ["Working hours", "Time between calls", "Hold", "Confirm", "Reminders"],
    connects: ["booking", "crm", "email"],
    oversight: "You choose when people can book and how much time you need between calls.",
    cell: [1, 1],
  },
  {
    id: "ai",
    name: "AI help",
    role: "Reads messages, sorts requests and drafts replies to save your team time.",
    flow: [
      "Conversation",
      "Understanding",
      "Sort the request",
      "Draft or next step",
      "Team review",
    ],
    connects: ["email", "follow-up", "crm", "data"],
    oversight:
      "The assistant can suggest an answer. Your team decides anything important, and unclear requests go to a person.",
    cell: [2, 1],
  },
  {
    id: "data",
    name: "Records",
    role: "Keep the information your team needs in one organised place.",
    flow: ["Collect", "Check", "Save", "Connect", "Find"],
    connects: ["crm", "pipeline", "analytics", "ai"],
    oversight: "The information belongs to you, and you can take a copy at any time.",
    cell: [3, 1],
  },
  {
    id: "analytics",
    name: "Reports",
    role: "What came in, what was answered, what was booked.",
    flow: ["Activity", "Where it came from", "Total", "Report", "Decision"],
    connects: ["crm", "pipeline", "data"],
    oversight: "We track the numbers that help you make decisions.",
    cell: [4, 1],
  },
] as const;

export function getSystem(id: SystemId): SystemModule {
  const found = systemModules.find((module) => module.id === id);
  if (!found) throw new Error(`Unknown system module: ${id}`);
  return found;
}
