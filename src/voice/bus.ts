/**
 * Focus requests from Vela to whatever page is showing.
 *
 * A tool may ask to light a capability on a page that has not rendered yet
 * (the agent navigates, then points). The request is held here until a page
 * that can honour it mounts and takes it. Cards opt in with
 * `data-cap-id` / `data-area`; nothing else on the page is touchable.
 */

export interface FocusRequest {
  readonly section?: string;
  readonly area?: string;
  readonly capability?: string;
}

let pending: FocusRequest | null = null;

export function requestFocus(req: FocusRequest) {
  pending = req;
  window.dispatchEvent(new CustomEvent<FocusRequest>("vela:focus", { detail: req }));
}

export function takePendingFocus(): FocusRequest | null {
  const p = pending;
  pending = null;
  return p;
}

/** Light the matching cards for a few seconds. */
export function lightCards(req: FocusRequest, ms = 7000) {
  const sel = req.capability
    ? `[data-cap-id="${CSS.escape(req.capability)}"]`
    : req.area
      ? `[data-area="${CSS.escape(req.area)}"] [data-cap-id]`
      : null;
  if (!sel) return false;
  const cards = [...document.querySelectorAll<HTMLElement>(sel)];
  for (const c of cards) c.setAttribute("data-lit", "");
  window.setTimeout(() => cards.forEach((c) => c.removeAttribute("data-lit")), ms);
  return cards.length > 0;
}
