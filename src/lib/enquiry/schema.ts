/**
 * Enquiry payload contract — the single definition trusted by the client
 * form and enforced by the server. Anything not described here is rejected;
 * unknown keys are stripped rather than forwarded.
 */

import { z } from "zod";
import {
  FOCUS_OPTIONS,
  branchSteps,
  focusStep,
  timelineStep,
  type Focus,
} from "@/content/enquiry-flow";

/** Strip control characters and clamp length before anything else sees it. */
const cleanString = (max: number) =>
  z
    .string()
    .transform((value) =>
      value.replace(/[\u0000-\u001f\u007f]/g, "").trim(),
    )
    .pipe(z.string().max(max));

const MAX_ELAPSED_MS = 1000 * 60 * 60 * 6;

const answerValue = z
  .string()
  .max(64)
  .regex(/^[a-z0-9-]+$/, "Unrecognized option");

export const enquirySchema = z
  .object({
    focus: z.enum(FOCUS_OPTIONS),

    /** stepId → selected option values. Validated against the flow below. */
    answers: z.record(z.string().max(48), z.array(answerValue).max(8)),

    name: cleanString(80).pipe(z.string().min(2, "Please give us a name")),
    email: z.email("Please give us a valid email").max(160),
    company: cleanString(120).optional(),
    website: cleanString(200).optional(),
    message: cleanString(2000).optional(),

    consent: z.literal(true, "Please confirm you are happy to be contacted"),

    /** Bot mitigation. Both are silently enforced, never explained in the UI. */
    hp: z.string().max(200).optional(),
    // Clamped, not capped: a visitor who left the tab open all afternoon is
    // slow, not invalid, and must not be refused for it.
    elapsedMs: z
      .number()
      .int()
      .min(0)
      .transform((value) => Math.min(value, MAX_ELAPSED_MS)),
  })
  .strict()
  .superRefine((value, ctx) => {
    // Answers must correspond to the flow the focus actually produces.
    const allowed = new Map<string, Set<string>>();
    for (const step of [focusStep, branchSteps[value.focus as Focus], timelineStep]) {
      allowed.set(step.id, new Set(step.options.map((option) => option.value)));
    }

    for (const [stepId, values] of Object.entries(value.answers)) {
      const permitted = allowed.get(stepId);
      if (!permitted) {
        ctx.addIssue({
          code: "custom",
          path: ["answers", stepId],
          message: "Unexpected question for this inquiry",
        });
        continue;
      }
      for (const candidate of values) {
        if (!permitted.has(candidate)) {
          ctx.addIssue({
            code: "custom",
            path: ["answers", stepId],
            message: "Unexpected answer",
          });
        }
      }
    }
  });

export type EnquiryInput = z.infer<typeof enquirySchema>;

/** Minimum time a human plausibly takes to complete the flow. */
export const MIN_ELAPSED_MS = 3_000;

export interface SubmissionVerdict {
  readonly accepted: boolean;
  /** Silently discarded rather than rejected, so bots learn nothing. */
  readonly silentDrop: boolean;
}

/**
 * Bot heuristics, kept separate from schema validation so the reasons stay
 * legible and the response can stay deliberately uninformative.
 */
export function screenSubmission(input: EnquiryInput): SubmissionVerdict {
  if (input.hp && input.hp.length > 0) return { accepted: false, silentDrop: true };
  if (input.elapsedMs < MIN_ELAPSED_MS) {
    return { accepted: false, silentDrop: true };
  }
  return { accepted: true, silentDrop: false };
}
