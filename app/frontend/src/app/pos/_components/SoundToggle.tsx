"use client";

import { Button } from "@heroui/react";
import { Volume2, VolumeX } from "lucide-react";
import { useRef } from "react";
import { useSoundState } from "@/hooks/useSoundState";
import { setMuted, unlockAudio } from "@/lib/sound/chime";

export function SoundToggle() {
  const { muted, locked } = useSoundState();
  // The unlock listener resolves before onPress, so remember whether this tap found the sound locked.
  const wasLocked = useRef(false);
  const hint = locked && !muted;
  const label = muted ? "เปิดเสียง" : hint ? "แตะเพื่อเปิดเสียง" : "ปิดเสียง";
  const Icon = muted ? VolumeX : Volume2;

  return (
    <div className="flex items-center gap-2">
      {hint ? <span className="text-small text-text-muted">แตะเพื่อเปิดเสียง</span> : null}
      <Button
        isIconOnly
        variant="ghost"
        aria-label={label}
        aria-pressed={muted}
        onPressStart={() => {
          wasLocked.current = locked;
        }}
        onPress={() => {
          if (wasLocked.current && !muted) {
            unlockAudio();
            return;
          }
          setMuted(!muted);
          if (muted) unlockAudio();
        }}
      >
        <Icon aria-hidden size={18} />
      </Button>
    </div>
  );
}
