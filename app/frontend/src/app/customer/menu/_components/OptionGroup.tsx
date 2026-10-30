"use client";

import { Checkbox, Chip, Label, Radio, RadioGroup } from "@heroui/react";
import type { MenuModifierGroup } from "@bar/contracts";
import { useId } from "react";
import { groupCount, groupMinimum, selectRadio, toggleOption } from "@/lib/order/catalog";
import { formatTHB } from "@/lib/utils/format";
import { toSatang } from "@/lib/utils/money";

function labelOf(name: string, priceDelta: string): string {
  return toSatang(priceDelta) > 0 ? `${name} +${formatTHB(priceDelta)}` : name;
}

export function OptionGroup({
  group,
  optionIds,
  onChange,
}: Readonly<{ group: MenuModifierGroup; optionIds: string[]; onChange: (optionIds: string[]) => void }>) {
  const labelId = useId();
  const count = groupCount(group, optionIds);
  const atMax = group.maxSelect > 1 && count >= group.maxSelect;
  const missing = count < groupMinimum(group);
  const picked = group.options.find((option) => optionIds.includes(option.id))?.id ?? "";

  return (
    <fieldset className="flex flex-col gap-2 border-0 p-0">
      <div className="flex items-center gap-2">
        <Label id={labelId}>{group.name}</Label>
        <Chip size="sm" variant="soft" color={missing ? "danger" : "default"}>
          {group.isRequired ? "ต้องเลือก" : "ไม่บังคับ"}
        </Chip>
        {group.maxSelect > 1 ? <span className="text-small text-text-muted">สูงสุด {group.maxSelect}</span> : null}
      </div>
      {group.maxSelect === 1 ? (
        <RadioGroup aria-labelledby={labelId} value={picked} onChange={(id) => onChange(selectRadio(group, id, optionIds))}>
          {group.options.map((option) => (
            <Radio key={option.id} value={option.id} className="min-h-11" aria-label={labelOf(option.name, option.priceDelta)} isDisabled={!option.isAvailable}>
              <Radio.Content>
                <Radio.Control>
                  <Radio.Indicator />
                </Radio.Control>
                <Label>{labelOf(option.name, option.priceDelta)}</Label>
              </Radio.Content>
            </Radio>
          ))}
        </RadioGroup>
      ) : (
        group.options.map((option) => (
          <Checkbox
            key={option.id}
            className="min-h-11"
            aria-label={labelOf(option.name, option.priceDelta)}
            isSelected={optionIds.includes(option.id)}
            isDisabled={!option.isAvailable || (atMax && !optionIds.includes(option.id))}
            onChange={() => onChange(toggleOption(group, option.id, optionIds))}
          >
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Label>{labelOf(option.name, option.priceDelta)}</Label>
            </Checkbox.Content>
          </Checkbox>
        ))
      )}
      {missing ? <p className="text-small text-text-danger">กรุณาเลือก{group.name}</p> : null}
    </fieldset>
  );
}
