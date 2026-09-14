"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/Primitives";
import { site } from "@/content/site";
import { BookingLink } from "@/components/chrome/ContactLinks";

/**
 * The confirmation is the demonstration: the enquiry visibly enters a process
 * rather than disappearing into an inbox. Every stage shown here is a stage
 * that actually exists on our side — nothing is theatre.
 */

const STAGES = [
  {
    key: "enquiry",
    title: "Enquiry",
    body: "Received, recorded and referenced. It is no longer in anyone’s memory.",
  },
  {
    key: "review",
    title: "Review",
    body: "A person reads it — what you are trying to improve, and whether we are the right people for it.",
  },
  {
    key: "follow-up",
    title: "Follow-up",
    body: "A reply with an honest assessment. If we are not the right fit, we will say so.",
  },
] as const;

export function EnquiryConfirmation({
  reference,
  name,
  onClose,
  headingId,
}: {
  readonly reference: string | null;
  readonly name?: string;
  readonly onClose?: () => void;
  readonly headingId?: string;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const firstName = name?.trim().split(/\s+/)[0];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[color:var(--color-hairline)] px-[var(--spacing-gutter)] pb-4 pt-5">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-6">
          <Label tone="champagne">Received</Label>
          <span aria-hidden="true" className="seam flex-1" />
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="label transition-colors duration-400 hover:text-[color:var(--color-ivory)]"
            >
              Close
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-[var(--spacing-gutter)] py-10 sm:py-14">
        <div className="mx-auto w-full max-w-2xl">
          <h2
            id={headingId}
            ref={headingRef}
            tabIndex={-1}
            className="display-md outline-none"
          >
            {firstName ? `Thank you, ${firstName}.` : "Thank you."}{" "}
            <span className="foil">It is in the system.</span>
          </h2>

          {reference ? (
            <p className="mt-5 text-sm text-[color:var(--color-muted)]">
              Reference{" "}
              <span className="text-[color:var(--color-champagne)]">{reference}</span>
              {" — "}quote it if you reply to us directly.
            </p>
          ) : null}

          {/* The enquiry entering a process. */}
          <ol className="mt-12 grid gap-px border border-[color:var(--color-hairline)] bg-[color:var(--color-hairline)] sm:grid-cols-3">
            {STAGES.map((stage, index) => (
              <li
                key={stage.key}
                className="relative bg-[color:var(--color-obsidian)] px-6 py-7"
                style={{ ["--stage-delay" as string]: `${index * 260}ms` }}
              >
                <span
                  aria-hidden="true"
                  className="stage-seam absolute inset-x-0 top-0 h-px"
                />
                <span className="label label-champagne">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="display-sm mt-3">{stage.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-muted)]">
                  {stage.body}
                </p>
              </li>
            ))}
          </ol>

          <p className="mt-10 text-[0.95rem] leading-relaxed text-[color:var(--color-ivory-dim)]">
            Expect a reply within one working day. If it is faster to talk, write to{" "}
            <a
              href={`mailto:${site.email}`}
              className="text-[color:var(--color-champagne)] underline decoration-[rgb(224_195_152/0.4)] underline-offset-4 transition-colors hover:decoration-[color:var(--color-champagne)]"
            >
              {site.email}
            </a>
            .
          </p>

          <BookingLink className="btn btn-secondary mt-6" />

          <div className="mt-12 border-t border-[color:var(--color-hairline)] pt-8">
            <Label tone="champagne">You&rsquo;re using a VelaBuilt system right now</Label>
            <p className="mt-4 max-w-[54ch] text-sm leading-relaxed text-[color:var(--color-muted)]">
              Capture, validation, reference, record, notification, reply. The same
              path we build for the businesses we work with — which is why nothing
              you just sent depends on somebody remembering it.
            </p>
            <Link
              href="/lead-follow-up-systems"
              className="btn btn-ghost mt-6"
              onClick={onClose}
            >
              <span>See how it is built</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
