import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { getSoundState, playChime, resetSoundForTests, setMuted, unlockAudio } from "./chime";

let started: number[];

class FakeAudioContext {
  state: AudioContextState = "suspended";
  currentTime = 0;
  destination = {};
  onstatechange: (() => void) | null = null;
  resume() {
    this.state = "running";
    return Promise.resolve();
  }
  createGain() {
    const param = { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} };
    return { gain: param, connect: (next: unknown) => next };
  }
  createOscillator() {
    return {
      type: "sine",
      frequency: { value: 0 },
      connect: (next: unknown) => next,
      start: (at: number) => started.push(at),
      stop() {},
    };
  }
}

beforeEach(() => {
  started = [];
  resetSoundForTests();
  localStorage.clear();
  vi.useFakeTimers();
  vi.stubGlobal("AudioContext", FakeAudioContext);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function unlocked() {
  unlockAudio();
  await vi.advanceTimersByTimeAsync(0);
}

test("AC-6: a locked context stays silent without error, then plays after unlock", async () => {
  expect(getSoundState().locked).toBe(true);
  expect(() => playChime("order")).not.toThrow();
  expect(started).toHaveLength(0);
  await unlocked();
  expect(getSoundState().locked).toBe(false);
  playChime("order");
  expect(started).toHaveLength(2);
});

test("bell plays three notes, order two", async () => {
  await unlocked();
  playChime("bell");
  expect(started).toHaveLength(3);
});

test("AC-7: bursts are throttled per kind, kinds are independent", async () => {
  await unlocked();
  for (let i = 0; i < 5; i += 1) playChime("order");
  playChime("bell");
  expect(started).toHaveLength(5);
  vi.advanceTimersByTime(2_000);
  playChime("order");
  expect(started).toHaveLength(7);
});

test("AC-5: mute silences and persists; blocked storage defaults to on", async () => {
  await unlocked();
  setMuted(true);
  playChime("order");
  expect(started).toHaveLength(0);
  expect(localStorage.getItem("bar.pos.sound")).toBe("off");

  resetSoundForTests();
  expect(getSoundState().muted).toBe(true);

  resetSoundForTests();
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  expect(getSoundState().muted).toBe(false);
  expect(() => setMuted(true)).not.toThrow();
  vi.restoreAllMocks();
});
