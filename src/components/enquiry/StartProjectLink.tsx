"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Focus } from "@/content/enquiry-flow";
import { ArrowRight } from "@/components/ui/Primitives";
import { useEnquiryDialog } from "./EnquiryDialogProvider";

/**
 * A real link to /start that upgrades to the in-place dialog when it can.
 * Modified clicks (new tab, new window, middle click) are left alone.
 */
export function StartProjectLink({
  children = "Start a project",
  variant = "primary",
  focus,
  className,
  withArrow = true,
}: {
  readonly children?: ReactNode;
  readonly variant?: "primary" | "secondary" | "ghost";
  readonly focus?: Focus;
  readonly className?: string;
  readonly withArrow?: boolean;
}) {
  const dialog = useEnquiryDialog();
  const href = focus ? `/start?focus=${focus}` : "/start";

  return (
    <Link
      href={href}
      className={`btn btn-${variant} ${className ?? ""}`}
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
      <span>{children}</span>
      {withArrow ? <ArrowRight /> : null}
    </Link>
  );
}
