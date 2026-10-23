"use client";

import { Label, Switch } from "@heroui/react";

// HeroUI renders the visible track outside the <label> that holds the input, so a click on the
// track toggles nothing (BRIEF-041 Rev 2). A click on the track is turned into the toggle here;
// the label, the input and the keyboard keep going through the Switch's own onChange.
export function MenuSwitch({
  label,
  hideLabel = false,
  isSelected,
  isDisabled,
  className,
  onChange,
}: Readonly<{
  label: string;
  hideLabel?: boolean;
  isSelected: boolean;
  isDisabled?: boolean;
  className?: string;
  onChange: (isSelected: boolean) => void;
}>) {
  return (
    <div
      className={className}
      role="presentation"
      onClick={(event) => {
        const onTrack = (event.target as Element).closest('[data-slot="switch-control"]') !== null;
        if (onTrack && !isDisabled) onChange(!isSelected);
      }}
    >
      <Switch isSelected={isSelected} isDisabled={isDisabled} onChange={onChange}>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Content>
          <Label className={hideLabel ? "sr-only" : undefined}>{label}</Label>
        </Switch.Content>
      </Switch>
    </div>
  );
}
