import type { MembershipInput, StaffMembership } from "@bar/contracts";

export type UntilMode = "permanent" | "end_of_night" | "custom";

export interface UntilChoice {
  mode: UntilMode;
  /** `datetime-local` text (`2026-11-01T06:00`), only read for `custom`. */
  custom: string;
}

export const PERMANENT: UntilChoice = { mode: "permanent", custom: "" };

/** `null` while a custom time is missing or not in the future — the server refuses a past time too (BRIEF-054). */
export function untilOf(choice: UntilChoice, now: Date): MembershipInput["until"] | null {
  if (choice.mode !== "custom") return choice.mode;
  const at = new Date(choice.custom);
  if (choice.custom === "" || Number.isNaN(at.getTime()) || at.getTime() <= now.getTime()) return null;
  return at.toISOString();
}

export function customError(choice: UntilChoice, now: Date): string | null {
  if (choice.mode !== "custom" || choice.custom === "") return null;
  return untilOf(choice, now) === null ? "เวลาสิ้นสุดต้องอยู่ในอนาคต" : null;
}

/** The whole set as the server last returned it. Expired rows are left out — a past time would be a 400, and the PUT drops them (BRIEF-054). */
export function currentSet(memberships: StaffMembership[]): MembershipInput[] {
  return memberships
    .filter((membership) => membership.state !== "expired")
    .map((membership) => ({ groupId: membership.groupId, until: membership.validUntil ?? "permanent" }));
}

const clock = new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false });
const dayAndClock = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });

/** "ถึง 06:00" within the next day, otherwise with the date. */
export function formatUntil(iso: string, now: Date): string {
  const at = new Date(iso);
  const withinDay = at.getTime() - now.getTime() <= 24 * 60 * 60 * 1000;
  return `ถึง ${(withinDay ? clock : dayAndClock).format(at)}`;
}

export function formatFrom(iso: string): string {
  return `เริ่ม ${dayAndClock.format(new Date(iso))}`;
}

/** Local `datetime-local` minimum: now, to the minute. */
export function localInputNow(now: Date): string {
  const shifted = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}
