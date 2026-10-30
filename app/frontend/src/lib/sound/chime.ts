export type ChimeKind = "order" | "bell";

export interface SoundState {
  muted: boolean;
  locked: boolean;
}

const STORAGE_KEY = "bar.pos.sound";
const THROTTLE_MS = 2_000;
const NOTE_SECONDS = 0.18;
const PEAK_GAIN = 0.12;

// Order = two rising notes (~0.4 s); bell = three notes (~0.6 s), so staff can tell them apart by ear.
const TUNES: Record<ChimeKind, { freqs: number[]; step: number }> = {
  order: { freqs: [660, 880], step: 0.2 },
  bell: { freqs: [988, 784, 988], step: 0.2 },
};

type AudioContextCtor = new () => AudioContext;

let context: AudioContext | null = null;
let state: SoundState | null = null;
const lastPlayed: Partial<Record<ChimeKind, number>> = {};
const listeners = new Set<() => void>();

function readMuted(): boolean {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) === "off";
  } catch {
    return false;
  }
}

function isLocked(): boolean {
  return context === null || context.state !== "running";
}

function publish(next: SoundState): void {
  if (state && state.muted === next.muted && state.locked === next.locked) return;
  state = next;
  for (const listener of listeners) listener();
}

// Lazy so the server render never touches localStorage.
export function getSoundState(): SoundState {
  state ??= { muted: readMuted(), locked: isLocked() };
  return state;
}

export const SERVER_SOUND_STATE: SoundState = { muted: false, locked: true };

export function subscribeSound(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setMuted(muted: boolean): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, muted ? "off" : "on");
  } catch {
    // Blocked storage: the choice lasts until reload.
  }
  publish({ ...getSoundState(), muted });
}

// Browsers keep audio locked until a user gesture, so the first tap creates and resumes the context.
export function unlockAudio(): void {
  if (!context) {
    const Ctor = (globalThis as { AudioContext?: AudioContextCtor }).AudioContext;
    if (!Ctor) return;
    try {
      context = new Ctor();
    } catch {
      return;
    }
    context.onstatechange = () => publish({ ...getSoundState(), locked: isLocked() });
  }
  context.resume().then(
    () => publish({ ...getSoundState(), locked: isLocked() }),
    () => undefined,
  );
}

function scheduleNote(ctx: AudioContext, freq: number, at: number): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(PEAK_GAIN, at + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + NOTE_SECONDS);
  osc.connect(gain).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + NOTE_SECONDS + 0.02);
}

export function playChime(kind: ChimeKind): void {
  const ctx = context;
  if (getSoundState().muted || !ctx || isLocked()) return;
  const now = Date.now();
  const last = lastPlayed[kind];
  if (last !== undefined && now - last < THROTTLE_MS) return;
  lastPlayed[kind] = now;
  try {
    const tune = TUNES[kind];
    tune.freqs.forEach((freq, index) => scheduleNote(ctx, freq, ctx.currentTime + index * tune.step));
  } catch {
    // A sound that fails must never break the alert.
  }
}

export function resetSoundForTests(): void {
  context = null;
  state = null;
  listeners.clear();
  delete lastPlayed.order;
  delete lastPlayed.bell;
}
