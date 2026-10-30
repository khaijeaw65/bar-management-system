"use client";

import { useSyncExternalStore } from "react";
import { getSoundState, SERVER_SOUND_STATE, subscribeSound, type SoundState } from "@/lib/sound/chime";

export function useSoundState(): SoundState {
  return useSyncExternalStore(subscribeSound, getSoundState, () => SERVER_SOUND_STATE);
}
