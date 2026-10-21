"use client";

import { Checkbox, Chip, Label, Radio, RadioGroup } from "@heroui/react";
import type { MenuModifierGroup } from "@bar/contracts";
import { useId } from "react";
import { formatTHB } from "@/lib/utils/format";
import { toSatang } from "@/lib/utils/money";
import { groupCount, groupMinimum, selectRadio, toggleOption } from "../catalog";

function delta(price: string): string {
  return toSatang(price) > 0 ? ` +${formatTHB(price)}` : "";
}

export function ModifierGroup({
  group,
  optionIds,
  onChange,
}: Readonly<{
  group: MenuModifierGroup;
  optionIds: string[];
  onChange: (optionIds: string[]) => void;
}>) {
  const labelId = useId();
  const count = groupCount(group, optionIds);
  const atMax = group.maxSelect > 0 && count >= group.maxSelect;
  const unsatisfied = count < groupMinimum(group);
  const single = group.maxSelect === 1;

  return (
    <fieldset className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Label id={labelId}>{group.name}</Label>
        <Chip size="sm" variant="soft" color={unsatisfied && group.isRequired ? "danger" : "default"}>
          {group.isRequired ? "ต้องเลือก" : "ไม่บังคับ"}
        </Chip>
      </div>
      {single ? (
        <RadioGroup aria-labelledby={labelId} value={group.options.find((option) => optionIds.includes(option.id))?.id ?? ""} onChange={(value) => onChange(selectRadio(group, value, optionIds))}>
          {group.options.map((option) => (
            <Radio
              key={option.id}
              value={option.id}
              aria-label={`${option.name}${delta(option.priceDelta)}`}
              isDisabled={!option.isAvailable}
            >
              <Radio.Content aria-label={`${option.name}${delta(option.priceDelta)}`}>
                <Radio.Control>
                  <Radio.Indicator />
                </Radio.Control>
                <Label>
                  {option.name}
                  {delta(option.priceDelta)}
                </Label>
              </Radio.Content>
            </Radio>
          ))}
        </RadioGroup>
      ) : (
        group.options.map((option) => (
          <Checkbox
            key={option.id}
            aria-label={`${option.name}${delta(option.priceDelta)}`}
            isSelected={optionIds.includes(option.id)}
            isDisabled={!option.isAvailable || (atMax && !optionIds.includes(option.id))}
            onChange={() => onChange(toggleOption(group, option.id, optionIds))}
          >
            <Checkbox.Content aria-label={`${option.name}${delta(option.priceDelta)}`}>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Label>
                {option.name}
                {delta(option.priceDelta)}
              </Label>
            </Checkbox.Content>
          </Checkbox>
        ))
      )}
      {atMax && group.maxSelect > 1 ? <p className="text-small text-text-muted">เลือกได้สูงสุด {group.maxSelect}</p> : null}
      {unsatisfied ? <p className="text-small text-text-danger">กรุณาเลือก{group.name}</p> : null}
    </fieldset>
  );
}
