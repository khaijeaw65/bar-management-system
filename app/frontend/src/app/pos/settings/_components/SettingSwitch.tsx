"use client";

import { Description, Label, Switch } from "@heroui/react";

export function SettingSwitch({
  label,
  help,
  isSelected,
  isDisabled,
  onChange,
}: Readonly<{ label: string; help: string; isSelected: boolean; isDisabled: boolean; onChange: (value: boolean) => void }>) {
  return (
    <Switch isSelected={isSelected} isDisabled={isDisabled} onChange={onChange}>
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
      <Switch.Content>
        <Label>{label}</Label>
        <Description>{help}</Description>
      </Switch.Content>
    </Switch>
  );
}
