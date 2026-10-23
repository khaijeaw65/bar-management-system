"use client";

import { Description, Label, Switch } from "@heroui/react";

export function SettingSwitch({
  label,
  help,
  isSelected,
  onChange,
}: Readonly<{ label: string; help: string; isSelected: boolean; onChange: (value: boolean) => void }>) {
  return (
    <Switch isSelected={isSelected} onChange={onChange}>
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
