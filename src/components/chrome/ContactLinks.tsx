import type { ReactNode } from "react";
import { site } from "@/content/site";

/**
 * Direct-contact slots. Each renders nothing until its value exists in
 * `site` (src/content/site.ts), so they can sit in the header, footer and
 * enquiry surfaces now without ever showing an invented number or link.
 */

export function PhoneLink({ className }: { readonly className?: string }) {
  if (!site.phone) return null;
  return (
    <a href={`tel:${site.phone.e164}`} className={className}>
      {site.phone.display}
    </a>
  );
}

export function BookingLink({
  className,
  children = "Book a call",
}: {
  readonly className?: string;
  readonly children?: ReactNode;
}) {
  if (!site.bookingUrl) return null;
  return (
    <a
      href={site.bookingUrl}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}
