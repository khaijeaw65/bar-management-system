"use client";

import { REPORT_MAX_PERIOD_DAYS } from "@bar/contracts";
import { DateField, DateRangePicker, FieldError, Label, ListBox, RangeCalendar, Select } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { useState } from "react";
import { I18nProvider } from "react-aria-components";
import type { ReportPeriod } from "@/lib/api/reports";
import { isValidPeriod, PERIOD_LABELS, type PeriodPreset } from "../period";

const PRESETS: PeriodPreset[] = ["today", "7", "30", "custom"];

export function PeriodSelect({
  preset,
  range,
  today,
  onPreset,
  onRange,
}: Readonly<{
  preset: PeriodPreset;
  range: ReportPeriod;
  today: string;
  onPreset: (preset: PeriodPreset) => void;
  onRange: (range: ReportPeriod) => void;
}>) {
  return (
    <div className="flex items-start gap-3">
      <Select
        aria-label="ช่วงเวลา"
        className="w-44"
        selectedKey={preset}
        onSelectionChange={(key) => {
          if (key !== null) onPreset(String(key) as PeriodPreset);
        }}
      >
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {PRESETS.map((key) => (
              <ListBox.Item key={key} id={key} textValue={PERIOD_LABELS[key]}>
                {PERIOD_LABELS[key]}
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
      {preset === "custom" ? <CustomRange range={range} today={today} onRange={onRange} /> : null}
    </div>
  );
}

function CustomRange({
  range,
  today,
  onRange,
}: Readonly<{ range: ReportPeriod; today: string; onRange: (range: ReportPeriod) => void }>) {
  const [invalid, setInvalid] = useState(false);

  // en-GB = day/month/year with Gregorian years; th-TH would switch the picker to Buddhist years.
  return (
    <I18nProvider locale="en-GB">
      <DateRangePicker
        aria-label="ช่วงวันที่"
        defaultValue={{ start: parseDate(range.from), end: parseDate(range.to) }}
        maxValue={parseDate(today)}
        isInvalid={invalid}
        onChange={(value) => {
          if (!value) return;
          const next = { from: value.start.toString(), to: value.end.toString() };
          const ok = isValidPeriod(next);
          setInvalid(!ok);
          if (ok) onRange(next);
        }}
      >
        <Label className="sr-only">ช่วงวันที่</Label>
        <DateField.Group>
          <DateField.Input slot="start">{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
          <DateRangePicker.RangeSeparator />
          <DateField.Input slot="end">{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
          <DateField.Suffix>
            <DateRangePicker.Trigger aria-label="เลือกช่วงวันที่">
              <DateRangePicker.TriggerIndicator />
            </DateRangePicker.Trigger>
          </DateField.Suffix>
        </DateField.Group>
        {invalid ? <FieldError>{`ช่วงเวลาต้องไม่เกิน ${REPORT_MAX_PERIOD_DAYS} วัน`}</FieldError> : null}
        <RangePopover />
      </DateRangePicker>
    </I18nProvider>
  );
}

function RangePopover() {
  return (
    <DateRangePicker.Popover>
      <RangeCalendar aria-label="ช่วงวันที่">
        <RangeCalendar.Header>
          <RangeCalendar.Heading />
          <RangeCalendar.NavButton slot="previous" />
          <RangeCalendar.NavButton slot="next" />
        </RangeCalendar.Header>
        <RangeCalendar.Grid>
          <RangeCalendar.GridHeader>{(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}</RangeCalendar.GridHeader>
          <RangeCalendar.GridBody>{(date) => <RangeCalendar.Cell date={date} />}</RangeCalendar.GridBody>
        </RangeCalendar.Grid>
      </RangeCalendar>
    </DateRangePicker.Popover>
  );
}
