"use client";

import { useEffect } from "react";
import { lightCards, takePendingFocus, type FocusRequest } from "@/voice/bus";

/**
 * Honours Vela's focus requests on whatever page is mounted: scrolls to the
 * section and lights the named cards. A request made before navigation is
 * picked up here once the destination renders.
 */
export function FocusReceiver() {
  useEffect(() => {
    const apply = (req: FocusRequest) => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (req.section) {
        document.getElementById(req.section)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      }
      window.setTimeout(() => lightCards(req), reduced ? 0 : 700);
    };
    const pending = takePendingFocus();
    if (pending) window.setTimeout(() => apply(pending), 250);
    const onFocus = (e: Event) => {
      // Events are for pages already showing; the bus holds the rest.
      takePendingFocus();
      apply((e as CustomEvent<FocusRequest>).detail);
    };
    window.addEventListener("vela:focus", onFocus);
    return () => window.removeEventListener("vela:focus", onFocus);
  }, []);
  return null;
}
