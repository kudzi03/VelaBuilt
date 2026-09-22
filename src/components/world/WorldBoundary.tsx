"use client";

/**
 * WHEN THE WORLD CANNOT BE BUILT.
 *
 * A WebGL context is not something a capability probe can promise. A device
 * can advertise WebGL2 and still refuse to hand one over — a blocklisted
 * driver, a lost GPU process, a browser already holding its maximum number
 * of contexts, a virtualised machine with no rasteriser. three.js throws in
 * that case, and an uncaught throw inside a React render takes the page down
 * with it.
 *
 * So the whole canvas sits behind a boundary. If it fails at any point — on
 * construction or on the thousandth frame — the world closes and the visitor
 * is returned to the conventional page, which was underneath the entire time
 * and never stopped working.
 *
 * No apology modal, no "your browser is not supported". They asked to see a
 * room; the room did not open; they are back where they were with everything
 * still available to them. Telling somebody their hardware disappointed you
 * is not information they can act on.
 *
 * The failure is reported once to the console so it is visible in a real
 * browser's devtools, and never to the visitor.
 */

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  onFailure: () => void;
}

interface State {
  failed: boolean;
}

export class WorldBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Deliberately console.warn rather than error: this is a handled
    // condition with a designed outcome, not a crash.
    console.warn("[velabuilt] the facility could not open:", error.message, info.componentStack);
    this.props.onFailure();
  }

  render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}
