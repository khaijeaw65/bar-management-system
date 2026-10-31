"use client";

import type { PermissionCatalog, PermissionCode } from "@bar/contracts";
import { Label, Switch } from "@heroui/react";

function ToggleSwitch({ label, code, isSelected, isDisabled, onChange }: Readonly<{ label: string; code?: string; isSelected: boolean; isDisabled: boolean; onChange: (on: boolean) => void }>) {
  return (
    <Switch aria-label={label} isSelected={isSelected} isDisabled={isDisabled} onChange={onChange} className="min-h-11">
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
      <Switch.Content>
        <Label>{label}</Label>
        {code ? <span className="text-small text-text-muted">{code}</span> : null}
      </Switch.Content>
    </Switch>
  );
}

/** One card per resource from the server's catalog; at 1280 each card reads as a table row, at 390 it stacks (CD-13 §8). */
export function PolicyMatrix({
  catalog,
  selected,
  readOnly,
  onChange,
}: Readonly<{ catalog: PermissionCatalog; selected: ReadonlySet<PermissionCode>; readOnly: boolean; onChange: (next: Set<PermissionCode>) => void }>) {
  function setCodes(codes: PermissionCode[], on: boolean) {
    const next = new Set(selected);
    for (const code of codes) {
      if (on) next.add(code);
      else next.delete(code);
    }
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      {catalog.map((resource) => {
        const codes = resource.actions.map((action) => action.code);
        return (
          <section key={resource.resource} aria-label={resource.label} className="flex flex-col gap-3 rounded-card border border-line-hairline bg-surface p-3 md:flex-row md:items-start md:gap-6">
            <div className="flex flex-col gap-1 md:w-56 md:shrink-0">
              <h3 className="text-body font-medium">{resource.label}</h3>
              <ToggleSwitch label={`ทั้งหมด ${resource.label}`} isSelected={codes.every((code) => selected.has(code))} isDisabled={readOnly} onChange={(on) => setCodes(codes, on)} />
            </div>
            <div className="flex flex-1 flex-col gap-1 md:grid md:grid-cols-2">
              {resource.actions.map((action) => (
                <ToggleSwitch key={action.code} label={action.label} code={action.code} isSelected={selected.has(action.code)} isDisabled={readOnly} onChange={(on) => setCodes([action.code], on)} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
