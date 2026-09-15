"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Focus } from "@/content/enquiry-flow";
import { ArrowRight } from "@/components/ui/Primitives";
import { useEnquiryDialog } from "./EnquiryDialogProvider";

/**
 * A real link to /start that upgrades to the in-place dialog when it can.
 * Modified clicks (new tab, new window, middle click) are left alone.
 *
 * Opening the inquiry is the site's one primary action, so it is the only
 * thing drawn as the solid `primary` button. `plain` carries no button
 * styling at all, for places such as the footer where it sits in a list of
 * ordinary links but should still open the dialog like every other copy.
 */
export function StartProjectLink({
  children = "Start a project",
  variant = "primary",
  focus,
  className,
  withArrow = variant !== "plain",
}: {
  readonly children?: ReactNode;
  readonly variant?: "primary" | "secondary" | "ghost" | "plain";
  readonly focus?: Focus;
  readonly className?: string;
  readonly withArrow?: boolean;
}) {
  const dialog = useEnquiryDialog();
  const href = focus ? `/start?focus=${focus}` : "/start";

  return (
    <Link
      href={href}
      className={variant === "plain" ? (className ?? "") : `btn btn-${variant} ${className ?? ""}`}
      onClick={(event) => {
        if (
          !dialog ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0
        ) {
          return;
        }
        event.preventDefault();
        dialog.open(focus);
      }}
    >
      {variant === "plain" ? children : <span>{children}</span>}
      {withArrow ? <ArrowRight /> : null}
    </Link>
  );
}
