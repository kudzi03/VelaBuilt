/**
 * THE SOUND OF THE PLACE.
 *
 * Every sound here is synthesised in the browser. No files, no downloads,
 * no sprite sheet. The same argument as the textures: a believable room tone
 * is filtered noise with the right spectrum, and shipping two megabytes of
 * WAV to achieve it would be worse in every measurable way.
 *
 * ── WHAT A ROOM ACTUALLY SOUNDS LIKE ─────────────────────────────────────
 *
 * Not silence. An empty hall has a floor of low-frequency air movement and
 * a faint mains hum, and your ear notices its absence far more than its
 * presence. Each hall gets a bed tuned to what it is: the atrium is wide and
 * airy, Intake has the narrow-band whine of equipment, Cadence has a slow
 * mechanical pulse. Crossfaded on entry over 1.4 s, which is about how long
 * it takes to walk through a doorway.
 *
 * ── FOOTSTEPS ────────────────────────────────────────────────────────────
 *
 * Driven by distance walked, not by a timer — so they slow when you slow and
 * stop the instant you stop, and never tick on while you stand still. Each
 * one is a short noise burst through a bandpass with a little randomisation,
 * because twelve identical footsteps is the most obvious tell in game audio.
 *
 * ── CONSENT AND AUTOPLAY ─────────────────────────────────────────────────
 *
 * The context is created only after the visitor presses something, and
 * `resume()` is called from that same gesture. Browsers refuse otherwise,
 * correctly. Muting ramps the master gain to zero rather than suspending, so
 * unmuting is instant rather than a half-second of dead air.
 */

import type { ToneId } from "./facility";

/** Per-hall bed. Frequencies in Hz, gains relative to the master. */
const BEDS: Record<ToneId, { cut: number; q: number; gain: number; hum: number | null }> = {
  // Wide, airy, almost nothing above 300 Hz. A big room with nobody in it.
  air: { cut: 240, q: 0.7, gain: 0.05, hum: null },
  // Equipment. The narrow band around 1 kHz is what reads as "machines".
  server: { cut: 950, q: 3.2, gain: 0.035, hum: 100 },
  // A small room with the door shut.
  quiet: { cut: 180, q: 0.9, gain: 0.03, hum: null },
  // Something turning over slowly, out of sight.
  mech: { cut: 420, q: 1.8, gain: 0.042, hum: 50 },
  // Soft furnishing, warm, close.
  room: { cut: 300, q: 0.8, gain: 0.038, hum: null },
};

/** Metres between footfalls. Matches the gait in player.ts. */
const STEP_DISTANCE = 0.78;

export interface WorldAudio {
  /** Crossfade to a hall's bed. Pass null in a corridor. */
  setTone(tone: ToneId | null): void;
  /** Called every frame with total metres walked. */
  step(distance: number): void;
  setMuted(muted: boolean): void;
  dispose(): void;
}

/**
 * Build the audio engine. Must be called from a user gesture, or the context
 * starts suspended and the first sound is swallowed.
 */
export function createWorldAudio(): WorldAudio | null {
  const Ctor: typeof AudioContext | undefined =
    typeof window !== "undefined"
      ? (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
      : undefined;
  if (!Ctor) return null;

  let ctx: AudioContext;
  try {
    ctx = new Ctor();
  } catch {
    return null;
  }
  void ctx.resume();

  const master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(ctx.destination);

  /* ── one noise buffer, reused for everything ──────────────────────────
     Four seconds of pink-ish noise. White noise sounds like a hiss; rolling
     off the highs is what makes it sound like air rather than a broken
     speaker. Generated once — regenerating per sound would allocate a
     megabyte every footstep. */
  const LEN = ctx.sampleRate * 4;
  const noise = ctx.createBuffer(1, LEN, ctx.sampleRate);
  const data = noise.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < LEN; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.0990460;
    b1 = 0.96300 * b1 + w * 0.2965164;
    b2 = 0.57000 * b2 + w * 1.0526913;
    data[i] = (b0 + b1 + b2 + w * 0.1848) * 0.16;
  }

  /* ── the bed ───────────────────────────────────────────────────────── */

  const bedSource = ctx.createBufferSource();
  bedSource.buffer = noise;
  bedSource.loop = true;

  const bedFilter = ctx.createBiquadFilter();
  bedFilter.type = "bandpass";
  bedFilter.frequency.value = BEDS.air.cut;
  bedFilter.Q.value = BEDS.air.q;

  const bedGain = ctx.createGain();
  bedGain.gain.value = 0;

  bedSource.connect(bedFilter).connect(bedGain).connect(master);
  bedSource.start();

  // The mains hum. A quiet sine that only some halls switch on — it is what
  // separates "a room with equipment in it" from "a room".
  const hum = ctx.createOscillator();
  hum.type = "sine";
  hum.frequency.value = 100;
  const humGain = ctx.createGain();
  humGain.gain.value = 0;
  hum.connect(humGain).connect(master);
  hum.start();

  let lastStep = 0;
  let current: ToneId | null = null;
  let disposed = false;

  const ramp = (param: AudioParam, to: number, seconds: number) => {
    const t = ctx.currentTime;
    param.cancelScheduledValues(t);
    param.setValueAtTime(param.value, t);
    param.linearRampToValueAtTime(to, t + seconds);
  };

  return {
    setTone(tone) {
      if (tone === current || disposed) return;
      current = tone;
      if (!tone) {
        // A corridor keeps the previous bed at half. Cutting it entirely
        // makes a doorway sound like a dropped connection.
        ramp(bedGain.gain, bedGain.gain.value * 0.5, 0.6);
        return;
      }
      const bed = BEDS[tone];
      ramp(bedFilter.frequency, bed.cut, 1.4);
      ramp(bedFilter.Q, bed.q, 1.4);
      ramp(bedGain.gain, bed.gain, 1.4);
      if (bed.hum) {
        hum.frequency.setTargetAtTime(bed.hum, ctx.currentTime, 0.4);
        ramp(humGain.gain, 0.012, 1.4);
      } else {
        ramp(humGain.gain, 0, 1.4);
      }
    },

    step(distance) {
      if (disposed || distance - lastStep < STEP_DISTANCE) return;
      lastStep = distance;

      const src = ctx.createBufferSource();
      src.buffer = noise;
      // A random offset into the buffer, so no two footsteps are the same
      // sample. This one line is most of why it does not sound looped.
      const offset = Math.random() * 3;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 900 + Math.random() * 500;
      filter.Q.value = 1.1;

      const g = ctx.createGain();
      const t = ctx.currentTime;
      const level = 0.05 + Math.random() * 0.02;
      // A heel is an attack and a very short decay. Anything longer than
      // ~90 ms stops being a step on concrete and becomes a thud.
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(level, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.085);

      src.connect(filter).connect(g).connect(master);
      src.start(t, offset, 0.12);
      src.stop(t + 0.13);
      // Let the node go when it has finished rather than keeping a handle.
      src.onended = () => {
        src.disconnect();
        filter.disconnect();
        g.disconnect();
      };
    },

    setMuted(muted) {
      if (disposed) return;
      // Ramped, not switched: a hard cut to zero is an audible click, and a
      // suspended context takes a moment to come back.
      ramp(master.gain, muted ? 0 : 0.9, 0.25);
      if (!muted) void ctx.resume();
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      try {
        bedSource.stop();
        hum.stop();
      } catch {
        /* Already stopped. */
      }
      void ctx.close();
    },
  };
}
