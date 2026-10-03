"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Focus } from "@/content/enquiry-flow";

/**
 * START A PROJECT lives at a real, crawlable route (/start). This provider
 * layers an in-place dialog over it for visitors with JavaScript, so the
 * enquiry never costs a page load — while the link underneath keeps working
 * for crawlers, keyboard users opening in a new tab, and failed hydration.
 *
 * The dialog is a native <dialog>: focus trapping, Escape-to-close, inert
 * background and scroll locking come from the platform rather than from
 * hand-written focus management that can drift out of correctness.
 */

export interface EnquiryPrefill {
  readonly focus?: Focus;
  /** Drafted by Vela, only with the visitor's agreement. Editable before sending. */
  readonly message?: string;
}

interface EnquiryDialogContextValue {
  readonly open: (focus?: Focus, prefill?: EnquiryPrefill) => void;
  readonly close: () => void;
  readonly isOpen: boolean;
}

const EnquiryDialogContext = createContext<EnquiryDialogContextValue | null>(null);

export function useEnquiryDialog(): EnquiryDialogContextValue | null {
  return useContext(EnquiryDialogContext);
}

// Loaded only when a visitor actually reaches for it.
const EnquiryFlow = dynamic(
  () => import("./EnquiryFlow").then((mod) => mod.EnquiryFlow),
  { ssr: false },
);

export function EnquiryDialogProvider({ children }: { readonly children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [initialFocus, setInitialFocus] = useState<Focus | undefined>();
  const [initialMessage, setInitialMessage] = useState<string | undefined>();
  // Re-mounts the flow when a new prefill arrives while the dialog is open.
  const [generation, setGeneration] = useState(0);

  const open = useCallback((focus?: Focus, prefill?: EnquiryPrefill) => {
    setInitialFocus(prefill?.focus ?? focus);
    setInitialMessage(prefill?.message);
    setGeneration((g) => g + 1);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Drive the native dialog from React state in one place.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
      document.documentElement.classList.add("no-scroll");
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Fires for Escape and for programmatic close alike.
    const handleClose = () => {
      setIsOpen(false);
      document.documentElement.classList.remove("no-scroll");
    };

    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, []);

  useEffect(() => {
    return () => document.documentElement.classList.remove("no-scroll");
  }, []);

  const value = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen]);

  return (
    <EnquiryDialogContext.Provider value={value}>
      {children}

      <dialog
        ref={dialogRef}
        aria-labelledby="enquiry-dialog-title"
        className="enquiry-dialog"
        // Clicking the backdrop (the dialog element itself) dismisses.
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
      >
        {isOpen ? (
          <div className="enquiry-dialog__inner" onClick={(e) => e.stopPropagation()}>
            <EnquiryFlow
              key={generation}
              initialFocus={initialFocus}
              initialMessage={initialMessage}
              onClose={close}
              headingId="enquiry-dialog-title"
              variant="dialog"
            />
          </div>
        ) : null}
      </dialog>
    </EnquiryDialogContext.Provider>
  );
}
