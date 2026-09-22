/**
 * COARSE POINTER, AS AN EXTERNAL STORE.
 *
 * Whether the visitor has a thumb or a mouse decides which control scheme the
 * world offers, and it is a fact about the device rather than application
 * state — so it is read with useSyncExternalStore, not probed in an effect.
 *
 * The server snapshot is `false`. A server has no pointer, and guessing
 * "touch" there would ship the thumb controls into the first paint of every
 * desktop visit and then swap them out, which is a visible flicker in the one
 * moment the experience has to look certain of itself.
 */

const QUERY = "(pointer: coarse)";

let snapshot = false;
let query: MediaQueryList | null = null;

function ensure(): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return null;
  if (!query) {
    query = window.matchMedia(QUERY);
    snapshot = query.matches;
  }
  return query;
}

function subscribe(onChange: () => void): () => void {
  const q = ensure();
  if (!q) return () => {};
  const handle = () => {
    snapshot = q.matches;
    onChange();
  };
  q.addEventListener("change", handle);
  return () => q.removeEventListener("change", handle);
}

const getSnapshot = (): boolean => {
  ensure();
  return snapshot;
};

const getServerSnapshot = (): boolean => false;

export const coarsePointerStore = { subscribe, getSnapshot, getServerSnapshot };
