"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  FOCUS_OPTIONS,
  branchSteps,
  focusStep,
  timelineStep,
  type Focus,
  type FlowStep,
} from "@/content/enquiry-flow";
import { site } from "@/content/site";
import { answersForFocus, enquiryMailtoHref } from "@/lib/enquiry/format";
import { FORM_FIELDS } from "@/lib/enquiry/form";
import { ArrowRight, Label } from "@/components/ui/Primitives";
import { EnquiryConfirmation } from "./EnquiryConfirmation";

/**
 * The progressive enquiry.
 *
 * Three short questions, then the minimum needed to continue a conversation.
 * Every step is a real fieldset with real inputs: the flow is navigable by
 * keyboard alone, announces its own progress, and validates inline before it
 * ever reaches the network.
 *
 * PROGRESSIVE ENHANCEMENT
 * The whole flow is one real <form method="post" action="/api/enquiry">.
 *
 *   Enhanced   Once hydrated, the form shows one question at a time exactly as
 *              designed and submits with fetch().
 *   Static     The server render — and what a visitor without JavaScript
 *              keeps — is the same form with every question in sequence,
 *              native `required` validation and a real submit button. It posts
 *              natively; the route answers with a redirect or a fallback page.
 *
 * With JavaScript available, `html.js` (set in <head> before first paint)
 * hides everything in the static render except the step the enhanced flow
 * opens on, so the switch at hydration is invisible. See globals.css,
 * "Enquiry: static form".
 */

type Phase = "questions" | "details" | "sent";

interface EnquiryFlowProps {
  readonly initialFocus?: Focus;
  readonly onClose?: () => void;
  readonly headingId?: string;
  readonly variant?: "dialog" | "page";
  /** Server render time, for the no-JS path's bot timing check. */
  readonly renderedAt?: number;
}

interface Details {
  name: string;
  email: string;
  company: string;
  website: string;
  message: string;
  consent: boolean;
}

const EMPTY_DETAILS: Details = {
  name: "",
  email: "",
  company: "",
  website: "",
  message: "",
  consent: false,
};

/** Mirrors the server's email check closely enough to catch typos natively. */
const EMAIL_PATTERN = "[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}";

const noSubscription = () => () => {};

/**
 * False while the server-rendered form is being hydrated, true afterwards —
 * and true immediately when mounted client-side only (the dialog), so the
 * dialog never flashes the static form.
 */
function useEnhanced(): boolean {
  return useSyncExternalStore(noSubscription, () => true, () => false);
}

export function EnquiryFlow({
  initialFocus,
  onClose,
  headingId,
  variant = "page",
  renderedAt,
}: EnquiryFlowProps) {
  const enhanced = useEnhanced();

  // Set on mount rather than during render: reading the clock while
  // rendering is impure and can drift between renders.
  const startedAt = useRef<number>(0);
  const liveRef = useRef<HTMLParagraphElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const [stepIndex, setStepIndex] = useState(initialFocus ? 1 : 0);
  const [phase, setPhase] = useState<Phase>("questions");
  const [answers, setAnswers] = useState<Record<string, string[]>>(
    initialFocus ? { [focusStep.id]: [initialFocus] } : {},
  );
  const [details, setDetails] = useState<Details>(EMPTY_DETAILS);
  const [errors, setErrors] = useState<Partial<Record<keyof Details, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");

  const focus = (answers[focusStep.id]?.[0] ?? null) as Focus | null;

  const steps: readonly FlowStep[] = useMemo(
    () => (focus ? [focusStep, branchSteps[focus], timelineStep] : [focusStep]),
    [focus],
  );

  const step = steps[Math.min(stepIndex, steps.length - 1)] ?? focusStep;
  const totalSteps = 4; // three questions plus details
  const currentNumber = phase === "details" ? 4 : Math.min(stepIndex + 1, 3);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  // Move focus to the new question so keyboard and screen-reader users follow.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [stepIndex, phase]);

  const select = useCallback(
    (stepId: string, value: string, multi: boolean) => {
      setAnswers((current) => {
        const existing = current[stepId] ?? [];
        if (!multi) return { ...current, [stepId]: [value] };
        return {
          ...current,
          [stepId]: existing.includes(value)
            ? existing.filter((entry) => entry !== value)
            : [...existing, value].slice(0, 8),
        };
      });

      // Single-choice questions advance on their own; multi-choice waits.
      if (!multi) {
        window.setTimeout(() => {
          setStepIndex((index) => {
            if (stepId === timelineStep.id) {
              setPhase("details");
              return index;
            }
            return index + 1;
          });
        }, 220);
      }
    },
    [],
  );

  const canContinue = (answers[step.id]?.length ?? 0) > 0;

  const goBack = useCallback(() => {
    setSubmitError(null);
    if (phase === "details") {
      setPhase("questions");
      setStepIndex(steps.length - 1);
      return;
    }
    setStepIndex((index) => Math.max(0, index - 1));
  }, [phase, steps.length]);

  const goForward = useCallback(() => {
    if (stepIndex >= steps.length - 1) {
      setPhase("details");
      return;
    }
    setStepIndex((index) => index + 1);
  }, [stepIndex, steps.length]);

  const validate = useCallback((value: Details) => {
    const next: Partial<Record<keyof Details, string>> = {};
    if (value.name.trim().length < 2) next.name = "Please tell us who you are.";
    if (!new RegExp(`^${EMAIL_PATTERN}$`).test(value.email.trim())) {
      next.email = "Please give us an email we can reply to.";
    }
    if (!value.consent) next.consent = "Please confirm we can reply to you.";
    return next;
  }, []);

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      // Only the final step sends. Nothing earlier can submit the form.
      if (phase !== "details") return;
      setSubmitError(null);

      const found = validate(details);
      setErrors(found);
      if (Object.keys(found).length > 0) {
        const firstKey = Object.keys(found)[0];
        document.getElementById(`enq-${firstKey}`)?.focus();
        return;
      }

      if (!focus) {
        setSubmitError("Please choose what you are trying to improve.");
        return;
      }

      setSubmitting(true);
      try {
        const response = await fetch("/api/enquiry", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            focus,
            // Only this focus's questions: answers left behind by going back
            // and changing the first answer would fail validation.
            answers: answersForFocus(focus, answers),
            name: details.name,
            email: details.email,
            company: details.company || undefined,
            website: details.website || undefined,
            message: details.message || undefined,
            consent: true,
            hp: honeypot,
            elapsedMs: startedAt.current ? Date.now() - startedAt.current : 0,
          }),
        });

        const payload: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            payload && typeof payload === "object" && "message" in payload
              ? String((payload as { message: unknown }).message)
              : "We could not send that just now. Please try again, or email us directly.";
          setSubmitError(message);
          return;
        }

        const ref =
          payload && typeof payload === "object" && "reference" in payload
            ? String((payload as { reference: unknown }).reference)
            : null;

        setReference(ref);
        setPhase("sent");
      } catch {
        setSubmitError(
          "That did not reach us — check your connection, or email hello@velabuilt.com.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [answers, details, focus, honeypot, phase, validate],
  );

  const mailtoHref = useMemo(
    () =>
      submitError
        ? enquiryMailtoHref({
            focus,
            answers,
            name: details.name,
            email: details.email,
            company: details.company,
            website: details.website,
            message: details.message,
          })
        : null,
    [answers, details, focus, submitError],
  );

  if (phase === "sent") {
    return (
      <EnquiryConfirmation
        reference={reference}
        name={details.name}
        onClose={onClose}
        headingId={headingId}
      />
    );
  }

  return (
    <form
      method="post"
      action="/api/enquiry"
      onSubmit={enhanced ? submit : undefined}
      noValidate={enhanced}
      data-enquiry-form={enhanced ? "enhanced" : "static"}
      className="flex h-full flex-col"
    >
      <FlowChrome
        current={currentNumber}
        total={totalSteps}
        onClose={onClose}
        variant={variant}
      />

      <p ref={liveRef} className="sr-only" role="status" aria-live="polite" data-enq-js-only="">
        Step {currentNumber} of {totalSteps}
      </p>

      <div className="flex-1 px-[var(--spacing-gutter)] pb-10 pt-8 sm:pt-12">
        <div className="mx-auto w-full max-w-2xl">
          {!enhanced ? (
            <StaticSteps
              initialFocus={initialFocus}
              headingId={headingId}
              renderedAt={renderedAt}
            />
          ) : phase === "questions" ? (
            <QuestionStep
              key={step.id}
              step={step}
              selected={answers[step.id] ?? []}
              onSelect={select}
              headingId={headingId}
              headingRef={headingRef}
              required={step.id === focusStep.id || step.id === timelineStep.id}
            />
          ) : (
            <DetailsStep
              details={details}
              setDetails={setDetails}
              errors={errors}
              submitting={submitting}
              submitError={submitError}
              mailtoHref={mailtoHref}
              headingId={headingId}
              headingRef={headingRef}
              honeypot={honeypot}
              setHoneypot={setHoneypot}
            />
          )}
        </div>
      </div>

      <div
        className="border-t border-[color:var(--color-hairline)] px-[var(--spacing-gutter)] py-5"
        data-enq-js-only=""
      >
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIndex === 0 && phase === "questions"}
            className="label transition-colors duration-400 hover:text-[color:var(--color-ivory)] disabled:opacity-35"
          >
            Back
          </button>

          {phase === "questions" && step.multi ? (
            <button
              type="button"
              onClick={goForward}
              disabled={!canContinue}
              className="btn btn-primary"
            >
              <span>Continue</span>
              <ArrowRight />
            </button>
          ) : (
            <p className="label">
              {phase === "details"
                ? "One reply from a person, not a sequence"
                : "Choose one"}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * Every question in one form, for the static render. Each section is marked
 * so CSS can show the right parts: without JavaScript, all of them (the
 * branch question only for the focus chosen); with it, only the section the
 * enhanced flow opens on (`data-enq-preview`) until hydration takes over.
 */
function StaticSteps({
  initialFocus,
  headingId,
  renderedAt,
}: {
  readonly initialFocus?: Focus;
  readonly headingId?: string;
  readonly renderedAt?: number;
}) {
  const preview = (isPreview: boolean) => (isPreview ? { "data-enq-preview": "" } : {});

  return (
    <>
      <div data-enq-section="" {...preview(!initialFocus)}>
        <QuestionStep
          step={focusStep}
          defaultSelected={initialFocus ? [initialFocus] : []}
          headingId={initialFocus ? undefined : headingId}
          required
        />
      </div>

      {FOCUS_OPTIONS.map((option) => (
        <div
          key={option}
          data-enq-section=""
          data-enq-branch={option}
          {...preview(initialFocus === option)}
        >
          <QuestionStep
            step={branchSteps[option]}
            headingId={initialFocus === option ? headingId : undefined}
          />
        </div>
      ))}

      <div data-enq-section="">
        <QuestionStep step={timelineStep} required />
      </div>

      <div data-enq-section="">
        <DetailsStep renderedAt={renderedAt} />
      </div>
    </>
  );
}

function FlowChrome({
  current,
  total,
  onClose,
  variant,
}: {
  readonly current: number;
  readonly total: number;
  readonly onClose?: () => void;
  readonly variant: "dialog" | "page";
}) {
  return (
    <div className="border-b border-[color:var(--color-hairline)] px-[var(--spacing-gutter)] pb-4 pt-5">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-6">
        <Label tone="champagne">Start a project</Label>

        <div className="flex flex-1 items-center gap-2" aria-hidden="true">
          {Array.from({ length: total }, (_, index) => (
            <span
              key={index}
              className="h-px flex-1 transition-colors duration-700"
              data-enq-js-only=""
              style={{
                background:
                  index < current
                    ? "linear-gradient(90deg, rgb(201 164 107 / 0.6), rgb(240 220 186 / 0.9))"
                    : "rgb(255 255 255 / 0.1)",
              }}
            />
          ))}
        </div>

        {variant === "dialog" && onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="label transition-colors duration-400 hover:text-[color:var(--color-ivory)]"
          >
            Close
          </button>
        ) : (
          <span className="label" data-enq-js-only="">
            {String(current).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        )}
      </div>
    </div>
  );
}

function QuestionStep({
  step,
  selected,
  defaultSelected,
  onSelect,
  headingId,
  headingRef,
  required = false,
}: {
  readonly step: FlowStep;
  /** Controlled selection (enhanced). Omit for a native, uncontrolled group. */
  readonly selected?: readonly string[];
  readonly defaultSelected?: readonly string[];
  readonly onSelect?: (stepId: string, value: string, multi: boolean) => void;
  readonly headingId?: string;
  readonly headingRef?: React.RefObject<HTMLHeadingElement | null>;
  /** Single-choice only: a checkbox group cannot natively require "one of". */
  readonly required?: boolean;
}) {
  const multi = Boolean(step.multi);
  const controlled = selected !== undefined;

  return (
    <fieldset className="border-0 p-0">
      <legend className="contents">
        <h2
          id={headingId}
          ref={headingRef}
          tabIndex={-1}
          className="display-md outline-none"
        >
          {step.question}
        </h2>
      </legend>

      {step.help ? (
        <p className="mt-4 text-sm text-[color:var(--color-muted)]">{step.help}</p>
      ) : null}
      {multi ? (
        <p className="mt-4 text-sm text-[color:var(--color-muted)]">
          Choose as many as apply.
        </p>
      ) : null}

      <div className="mt-9 grid gap-2.5">
        {step.options.map((option) => {
          const isSelected = controlled
            ? selected.includes(option.value)
            : Boolean(defaultSelected?.includes(option.value));
          const id = `enq-${step.id}-${option.value}`;
          return (
            <label
              key={option.value}
              htmlFor={id}
              data-selected={isSelected}
              className="panel panel-interactive group flex cursor-pointer items-start gap-4 px-5 py-4 data-[selected=true]:border-[rgb(224_195_152/0.45)] has-checked:border-[rgb(224_195_152/0.45)]"
            >
              <input
                id={id}
                type={multi ? "checkbox" : "radio"}
                name={step.id}
                value={option.value}
                required={!multi && required}
                {...(controlled
                  ? {
                      checked: isSelected,
                      onChange: () => onSelect?.(step.id, option.value, multi),
                    }
                  : { defaultChecked: isSelected })}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                data-selected={isSelected}
                className="mt-1.5 h-2 w-2 shrink-0 border border-[color:var(--color-hairline-strong)] transition-colors duration-400 data-[selected=true]:border-[color:var(--color-champagne)] data-[selected=true]:bg-[color:var(--color-champagne)] group-has-checked:border-[color:var(--color-champagne)] group-has-checked:bg-[color:var(--color-champagne)]"
                style={{ borderRadius: multi ? 0 : "9999px" }}
              />
              <span className="min-w-0">
                <span className="block text-[0.98rem] text-[color:var(--color-ivory)]">
                  {option.label}
                </span>
                {option.hint ? (
                  <span className="mt-1 block text-sm text-[color:var(--color-muted)]">
                    {option.hint}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

interface DetailsStepProps {
  /** Omit the enhanced props for the static (native) render. */
  readonly details?: Details;
  readonly setDetails?: React.Dispatch<React.SetStateAction<Details>>;
  readonly errors?: Partial<Record<keyof Details, string>>;
  readonly submitting?: boolean;
  readonly submitError?: string | null;
  readonly mailtoHref?: string | null;
  readonly headingId?: string;
  readonly headingRef?: React.RefObject<HTMLHeadingElement | null>;
  readonly honeypot?: string;
  readonly setHoneypot?: (value: string) => void;
  readonly renderedAt?: number;
}

function DetailsStep({
  details,
  setDetails,
  errors = {},
  submitting = false,
  submitError,
  mailtoHref,
  headingId,
  headingRef,
  honeypot,
  setHoneypot,
  renderedAt,
}: DetailsStepProps) {
  const errorId = useId();
  const controlled = details !== undefined && setDetails !== undefined;

  const set = <K extends keyof Details>(key: K, value: Details[K]) =>
    setDetails?.((current) => ({ ...current, [key]: value }));

  const bind = (key: Exclude<keyof Details, "consent">) =>
    controlled
      ? { value: details[key], onChange: (value: string) => set(key, value) }
      : {};

  return (
    <div>
      <h2 id={headingId} ref={headingRef} tabIndex={-1} className="display-md outline-none">
        Where should we reply?
      </h2>
      <p className="mt-4 text-sm text-[color:var(--color-muted)]">
        Only what we need to continue the conversation. No newsletter, no sequence.
      </p>

      <div className="mt-9 grid gap-5 sm:grid-cols-2">
        <Field
          id="enq-name"
          name="name"
          label="Name"
          required
          minLength={2}
          maxLength={80}
          {...bind("name")}
          error={errors.name}
          autoComplete="name"
        />
        <Field
          id="enq-email"
          name="email"
          label="Email"
          type="email"
          required
          maxLength={160}
          pattern={EMAIL_PATTERN}
          {...bind("email")}
          error={errors.email}
          autoComplete="email"
        />
        <Field
          id="enq-company"
          name="company"
          label="Company"
          optional
          maxLength={120}
          {...bind("company")}
          autoComplete="organization"
        />
        <Field
          id="enq-website"
          name="website"
          label="Website"
          optional
          maxLength={200}
          {...bind("website")}
          placeholder="example.com"
          autoComplete="url"
        />
      </div>

      <div className="mt-5">
        <label htmlFor="enq-message" className="label mb-2.5 block">
          Anything else <span className="text-[color:var(--color-faint)]">(optional)</span>
        </label>
        <textarea
          id="enq-message"
          name="message"
          rows={4}
          maxLength={2000}
          className="field resize-y"
          {...(controlled
            ? {
                value: details.message,
                onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) =>
                  set("message", event.target.value),
              }
            : {})}
          placeholder="What is happening now, in your own words."
        />
      </div>

      {/* Honeypot: off-screen, not hidden, never announced, never focusable. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
        <label htmlFor="enq-role">Role</label>
        <input
          id="enq-role"
          name={FORM_FIELDS.honeypot}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...(controlled
            ? {
                value: honeypot ?? "",
                onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                  setHoneypot?.(event.target.value),
              }
            : {})}
        />
      </div>

      {!controlled && renderedAt ? (
        <input type="hidden" name={FORM_FIELDS.renderedAt} value={renderedAt} />
      ) : null}

      <div className="mt-7">
        <label
          htmlFor="enq-consent"
          className="flex cursor-pointer items-start gap-3.5 text-sm text-[color:var(--color-ivory-dim)]"
        >
          <input
            id="enq-consent"
            name={FORM_FIELDS.consent}
            value="yes"
            type="checkbox"
            required
            {...(controlled
              ? {
                  checked: details.consent,
                  onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                    set("consent", event.target.checked),
                }
              : {})}
            aria-invalid={errors.consent ? "true" : undefined}
            aria-describedby={errors.consent ? `${errorId}-consent` : undefined}
            className="mt-1 h-4 w-4 shrink-0 accent-[color:var(--color-champagne)]"
          />
          <span>
            You can reply to me about this inquiry. We will not add you to a mailing
            list.
          </span>
        </label>
        {errors.consent ? (
          <p id={`${errorId}-consent`} className="mt-2 text-sm text-[#d78a6f]">
            {errors.consent}
          </p>
        ) : null}
      </div>

      {submitError ? (
        <div
          role="alert"
          className="mt-6 border border-[#7a3d2b] bg-[rgb(122_61_43/0.12)] px-4 py-3 text-sm text-[#e0a58c]"
        >
          <p>{submitError}</p>
          {mailtoHref ? (
            <a
              href={mailtoHref}
              className="mt-2 inline-block text-[color:var(--color-champagne)] underline decoration-[rgb(224_195_152/0.4)] underline-offset-4 transition-colors hover:decoration-[color:var(--color-champagne)]"
            >
              Email this inquiry to {site.email}
            </a>
          ) : null}
        </div>
      ) : null}

      <button type="submit" disabled={submitting} className="btn btn-primary mt-8 w-full justify-between sm:w-auto">
        <span>{submitting ? "Sending…" : "Send inquiry"}</span>
        <ArrowRight />
      </button>
    </div>
  );
}

function Field({
  id,
  name,
  label,
  value,
  onChange,
  error,
  type = "text",
  required = false,
  optional = false,
  minLength,
  maxLength,
  pattern,
  placeholder,
  autoComplete,
}: {
  readonly id: string;
  readonly name: string;
  readonly label: string;
  /** Omit value and onChange for a native, uncontrolled field. */
  readonly value?: string;
  readonly onChange?: (value: string) => void;
  readonly error?: string;
  readonly type?: string;
  readonly required?: boolean;
  readonly optional?: boolean;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
  readonly placeholder?: string;
  readonly autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="label mb-2.5 block">
        {label}{" "}
        {optional ? <span className="text-[color:var(--color-faint)]">(optional)</span> : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        {...(onChange
          ? { value, onChange: (event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value) }
          : {})}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        pattern={pattern}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="field"
      />
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-[#d78a6f]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
