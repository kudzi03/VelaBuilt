/**
 * INPUT.
 *
 * One object the frame loop reads, three ways to fill it: keyboard + pointer
 * lock, touch, and the guide (which drives the player directly rather than
 * through here). Nothing in this file touches React state — a key press that
 * re-rendered the page would drop frames on every step.
 *
 * ── POINTER LOCK, HANDLED HONESTLY ───────────────────────────────────────
 *
 * Lock is requested on a click INSIDE the world and never on load. Escape
 * releases it, which is the browser's behaviour and not something to fight.
 * When it releases, movement stops dead rather than continuing with whatever
 * keys were held — a visitor who hits Escape and finds themselves still
 * walking has been robbed of the control they just asked for.
 *
 * Browsers also rate-limit re-locking after an Escape (roughly a second).
 * Requesting during that window throws asynchronously, so `request()` swallows
 * it and the interface shows "click to look" until it takes.
 *
 * ── TOUCH ────────────────────────────────────────────────────────────────
 *
 * Left half of the screen is a floating stick: it appears where the thumb
 * lands rather than at a fixed rosette, because thumbs do not land in the same
 * place twice. Right half is look-drag. Both are tracked by pointer id, so a
 * second thumb never steals the first one's gesture — the bug that makes most
 * mobile first-person controls unusable.
 */

export interface InputFrame {
  strafe: number;
  forward: number;
  yawDelta: number;
  pitchDelta: number;
  /** Rising edge of the interact control since the last frame. */
  interact: boolean;
}

const KEY_MAP: Readonly<Record<string, "f" | "b" | "l" | "r">> = {
  KeyW: "f",
  ArrowUp: "f",
  KeyS: "b",
  ArrowDown: "b",
  KeyA: "l",
  ArrowLeft: "l",
  KeyD: "r",
  ArrowRight: "r",
};

/** Look sensitivity for touch, relative to mouse. Thumbs travel further. */
const TOUCH_LOOK = 1.35;
/** Pixels from the stick origin for full deflection. */
const STICK_RANGE = 58;

export interface TouchStick {
  /** Screen position the stick was planted at, or null when not engaged. */
  readonly origin: { x: number; y: number } | null;
  /** Current thumb position. */
  readonly point: { x: number; y: number } | null;
}

export class Input {
  private readonly held = new Set<"f" | "b" | "l" | "r">();
  private yaw = 0;
  private pitch = 0;
  private interactEdge = false;

  private stickId: number | null = null;
  private stickOrigin: { x: number; y: number } | null = null;
  private stickPoint: { x: number; y: number } | null = null;
  private lookId: number | null = null;
  private lookLast: { x: number; y: number } | null = null;

  private locked = false;
  private readonly el: HTMLElement;
  private readonly onLockChange: (locked: boolean) => void;
  private readonly onStick: (s: TouchStick) => void;
  private detach: Array<() => void> = [];

  constructor(
    el: HTMLElement,
    opts: {
      onLockChange?: (locked: boolean) => void;
      onStick?: (s: TouchStick) => void;
    } = {},
  ) {
    this.el = el;
    this.onLockChange = opts.onLockChange ?? (() => {});
    this.onStick = opts.onStick ?? (() => {});
    this.bind();
  }

  get isLocked(): boolean {
    return this.locked;
  }

  /** Ask for pointer lock. Safe to call when already locked or rate-limited. */
  request(): void {
    if (this.locked) return;
    try {
      const p = this.el.requestPointerLock() as unknown as Promise<void> | undefined;
      // Chrome returns a promise and rejects it during the re-lock cooldown.
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch {
      /* Safari throws synchronously in the same case. */
    }
  }

  release(): void {
    if (document.pointerLockElement === this.el) document.exitPointerLock();
  }

  /** Consume the accumulated frame. Deltas reset; held keys persist. */
  read(): InputFrame {
    let strafe = 0;
    let forward = 0;
    if (this.held.has("l")) strafe -= 1;
    if (this.held.has("r")) strafe += 1;
    if (this.held.has("f")) forward += 1;
    if (this.held.has("b")) forward -= 1;

    if (this.stickOrigin && this.stickPoint) {
      const dx = this.stickPoint.x - this.stickOrigin.x;
      const dy = this.stickPoint.y - this.stickOrigin.y;
      const len = Math.hypot(dx, dy);
      if (len > 6) {
        const k = Math.min(len, STICK_RANGE) / STICK_RANGE;
        // Square the response near centre: fine positioning close in, full
        // speed at the rim. A linear stick makes a thumb feel twitchy.
        const curve = k * k;
        strafe += (dx / len) * curve;
        forward += (-dy / len) * curve;
      }
    }

    const frame: InputFrame = {
      strafe: clamp(strafe, -1, 1),
      forward: clamp(forward, -1, 1),
      yawDelta: this.yaw,
      pitchDelta: this.pitch,
      interact: this.interactEdge,
    };
    this.yaw = 0;
    this.pitch = 0;
    this.interactEdge = false;
    return frame;
  }

  /** Drop every held key. Called when lock is lost or the world is hidden. */
  clear(): void {
    this.held.clear();
    this.yaw = 0;
    this.pitch = 0;
    this.stickId = null;
    this.stickOrigin = null;
    this.stickPoint = null;
    this.lookId = null;
    this.lookLast = null;
    this.onStick({ origin: null, point: null });
  }

  /** The mobile interact button and the guide both press this. */
  pressInteract(): void {
    this.interactEdge = true;
  }

  dispose(): void {
    for (const off of this.detach) off();
    this.detach = [];
    this.clear();
  }

  /* ── wiring ───────────────────────────────────────────────────────────── */

  private bind(): void {
    const on = <K extends keyof DocumentEventMap>(
      target: EventTarget,
      type: K | string,
      fn: (e: never) => void,
      opts?: AddEventListenerOptions,
    ) => {
      target.addEventListener(type, fn as EventListener, opts);
      this.detach.push(() => target.removeEventListener(type, fn as EventListener, opts));
    };

    on(window, "keydown", (e: KeyboardEvent) => {
      // Never swallow a shortcut the visitor meant for the browser, and never
      // capture keys while they are typing in the enquiry form.
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;

      const k = KEY_MAP[e.code];
      if (k) {
        this.held.add(k);
        e.preventDefault();
        return;
      }
      if (e.code === "KeyE" || e.code === "Space") {
        this.interactEdge = true;
        e.preventDefault();
      }
    });

    on(window, "keyup", (e: KeyboardEvent) => {
      const k = KEY_MAP[e.code];
      if (k) this.held.delete(k);
    });

    // A held key during a tab switch would otherwise stay held forever.
    on(window, "blur", () => this.clear());
    on(document, "visibilitychange", () => {
      if (document.hidden) this.clear();
    });

    on(document, "pointerlockchange", () => {
      const next = document.pointerLockElement === this.el;
      if (next !== this.locked) {
        this.locked = next;
        if (!next) this.clear();
        this.onLockChange(next);
      }
    });

    on(window, "mousemove", (e: MouseEvent) => {
      if (!this.locked) return;
      // movementX can spike enormously on a driver hiccup; a 250px frame is
      // already a violent flick and anything beyond it is a glitch.
      this.yaw += clamp(e.movementX, -250, 250);
      this.pitch += clamp(e.movementY, -250, 250);
    });

    on(
      this.el,
      "pointerdown",
      (e: PointerEvent) => {
        if (e.pointerType === "mouse") {
          this.request();
          return;
        }
        const left = e.clientX < window.innerWidth * 0.5;
        if (left && this.stickId === null) {
          this.stickId = e.pointerId;
          this.stickOrigin = { x: e.clientX, y: e.clientY };
          this.stickPoint = { x: e.clientX, y: e.clientY };
          this.onStick({ origin: this.stickOrigin, point: this.stickPoint });
        } else if (!left && this.lookId === null) {
          this.lookId = e.pointerId;
          this.lookLast = { x: e.clientX, y: e.clientY };
        }
      },
      { passive: true },
    );

    on(this.el, "pointermove", (e: PointerEvent) => {
      if (e.pointerId === this.stickId) {
        this.stickPoint = { x: e.clientX, y: e.clientY };
        this.onStick({ origin: this.stickOrigin, point: this.stickPoint });
        e.preventDefault();
      } else if (e.pointerId === this.lookId && this.lookLast) {
        this.yaw += (e.clientX - this.lookLast.x) * TOUCH_LOOK;
        this.pitch += (e.clientY - this.lookLast.y) * TOUCH_LOOK;
        this.lookLast = { x: e.clientX, y: e.clientY };
        e.preventDefault();
      }
    });

    const end = (e: PointerEvent) => {
      if (e.pointerId === this.stickId) {
        this.stickId = null;
        this.stickOrigin = null;
        this.stickPoint = null;
        this.onStick({ origin: null, point: null });
      } else if (e.pointerId === this.lookId) {
        this.lookId = null;
        this.lookLast = null;
      }
    };
    on(this.el, "pointerup", end, { passive: true });
    on(this.el, "pointercancel", end, { passive: true });
  }
}

const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;
