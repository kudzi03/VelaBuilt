"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  branchSteps,
  focusStep,
  timelineStep,
  type Focus,
  type FlowStep,
} from "@/content/enquiry-flow";
import { ArrowRight, Label } from "@/components/ui/Primitives";
import { EnquiryConfirmation } from "./EnquiryConfirmation";

/**
 * The progressive enquiry.
 *
 * Three short questions, then the minimum needed to continue a conversation.
 * Every step is a real fieldset with real inputs: the flow is navigable by
 * keyboard alone, announces its own progress, and validates inline before it
 * ever reaches the network.
 */

type Phase = "questions" | "details" | "sent";

interface EnquiryFlowProps {
  readonly initialFocus?: Focus;
  readonly onClose?: () => void;
  readonly headingId?: string;
  readonly variant?: "dialog" | "page";
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

export function EnquiryFlow({
  initialFocus,
  onClose,
  headingId,
  variant = "page",
}: EnquiryFlowProps) {
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.email.trim())) {
      next.email = "Please give us an email we can reply to.";
    }
    if (!value.consent) next.consent = "Please confirm we can reply to you.";
    return next;
  }, []);

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
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
            answers,
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
    [answers, details, focus, honeypot, validate],
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
    <div className="flex h-full flex-col">
      <FlowChrome
        current={currentNumber}
        total={totalSteps}
        onClose={onClose}
        variant={variant}
      />

      <p ref={liveRef} className="sr-only" role="status" aria-live="polite">
        Step {currentNumber} of {totalSteps}
      </p>

      <div className="flex-1 px-[var(--spacing-gutter)] pb-10 pt-8 sm:pt-12">
        <div className="mx-auto w-full max-w-2xl">
          {phase === "questions" ? (
            <QuestionStep
              key={step.id}
              step={step}
              selected={answers[step.id] ?? []}
              onSelect={select}
              headingId={headingId}
              headingRef={headingRef}
            />
          ) : (
            <DetailsStep
              details={details}
              setDetails={setDetails}
              errors={errors}
              onSubmit={submit}
              submitting={submitting}
              submitError={submitError}
              headingId={headingId}
              headingRef={headingRef}
              honeypot={honeypot}
              setHoneypot={setHoneypot}
            />
          )}
        </div>
      </div>

      <div className="border-t border-[color:var(--color-hairline)] px-[var(--spacing-gutter)] py-5">
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
    </div>
  );
}

/* -------------------------------------------------------------------------- */

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
          <span className="label">
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
  onSelect,
  headingId,
  headingRef,
}: {
  readonly step: FlowStep;
  readonly selected: readonly string[];
  readonly onSelect: (stepId: string, value: string, multi: boolean) => void;
  readonly headingId?: string;
  readonly headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const multi = Boolean(step.multi);
  const groupName = `enq-${step.id}`;

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
          const isSelected = selected.includes(option.value);
          const id = `${groupName}-${option.value}`;
          return (
            <label
              key={option.value}
              htmlFor={id}
              data-selected={isSelected}
              className="panel panel-interactive group flex cursor-pointer items-start gap-4 px-5 py-4 data-[selected=true]:border-[rgb(224_195_152/0.45)]"
            >
              <input
                id={id}
                type={multi ? "checkbox" : "radio"}
                name={groupName}
                value={option.value}
                checked={isSelected}
                onChange={() => onSelect(step.id, option.value, multi)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                data-selected={isSelected}
                className="mt-1.5 h-2 w-2 shrink-0 border border-[color:var(--color-hairline-strong)] transition-colors duration-400 data-[selected=true]:border-[color:var(--color-champagne)] data-[selected=true]:bg-[color:var(--color-champagne)]"
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

function DetailsStep({
  details,
  setDetails,
  errors,
  onSubmit,
  submitting,
  submitError,
  headingId,
  headingRef,
  honeypot,
  setHoneypot,
}: {
  readonly details: Details;
  readonly setDetails: React.Dispatch<React.SetStateAction<Details>>;
  readonly errors: Partial<Record<keyof Details, string>>;
  readonly onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  readonly submitting: boolean;
  readonly submitError: string | null;
  readonly headingId?: string;
  readonly headingRef: React.RefObject<HTMLHeadingElement | null>;
  readonly honeypot: string;
  readonly setHoneypot: (value: string) => void;
}) {
  const errorId = useId();

  const set = <K extends keyof Details>(key: K, value: Details[K]) =>
    setDetails((current) => ({ ...current, [key]: value }));

  return (
    <form onSubmit={onSubmit} noValidate>
      <h2 id={headingId} ref={headingRef} tabIndex={-1} className="display-md outline-none">
        Where should we reply?
      </h2>
      <p className="mt-4 text-sm text-[color:var(--color-muted)]">
        Only what we need to continue the conversation. No newsletter, no sequence.
      </p>

      <div className="mt-9 grid gap-5 sm:grid-cols-2">
        <Field
          id="enq-name"
          label="Name"
          required
          value={details.name}
          onChange={(value) => set("name", value)}
          error={errors.name}
          autoComplete="name"
        />
        <Field
          id="enq-email"
          label="Email"
          type="email"
          required
          value={details.email}
          onChange={(value) => set("email", value)}
          error={errors.email}
          autoComplete="email"
        />
        <Field
          id="enq-company"
          label="Company"
          optional
          value={details.company}
          onChange={(value) => set("company", value)}
          autoComplete="organization"
        />
        <Field
          id="enq-website"
          label="Website"
          optional
          value={details.website}
          onChange={(value) => set("website", value)}
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
          rows={4}
          maxLength={2000}
          className="field resize-y"
          value={details.message}
          onChange={(event) => set("message", event.target.value)}
          placeholder="What is happening now, in your own words."
        />
      </div>

      {/* Honeypot: off-screen, not hidden, never announced, never focusable. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
        <label htmlFor="enq-role">Role</label>
        <input
          id="enq-role"
          name="role"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      <div className="mt-7">
        <label
          htmlFor="enq-consent"
          className="flex cursor-pointer items-start gap-3.5 text-sm text-[color:var(--color-ivory-dim)]"
        >
          <input
            id="enq-consent"
            type="checkbox"
            checked={details.consent}
            onChange={(event) => set("consent", event.target.checked)}
            aria-invalid={errors.consent ? "true" : undefined}
            aria-describedby={errors.consent ? `${errorId}-consent` : undefined}
            className="mt-1 h-4 w-4 shrink-0 accent-[color:var(--color-champagne)]"
          />
          <span>
            You can reply to me about this enquiry. We will not add you to a mailing
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
        <p
          role="alert"
          className="mt-6 border border-[#7a3d2b] bg-[rgb(122_61_43/0.12)] px-4 py-3 text-sm text-[#e0a58c]"
        >
          {submitError}
        </p>
      ) : null}

      <button type="submit" disabled={submitting} className="btn btn-primary mt-8 w-full justify-between sm:w-auto">
        <span>{submitting ? "Sending…" : "Send enquiry"}</span>
        <ArrowRight />
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  required = false,
  optional = false,
  placeholder,
  autoComplete,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly error?: string;
  readonly type?: string;
  readonly required?: boolean;
  readonly optional?: boolean;
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
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
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
