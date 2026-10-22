import { PaymentAttemptSchema, type Payment, type PaymentAttempt, type VisitDetail } from "@bar/contracts";
import { cmpMoney, fromSatang, toSatang } from "@/lib/utils/money";

const tendered = /^\d+(\.\d{1,2})?$/;

export function pendingPayment(visit: VisitDetail): Payment | null {
  for (const attempt of visit.payments) {
    const part = attempt.parts.find((item) => item.status === "pending");
    if (part) return part;
  }
  return null;
}

export function lineCount(visit: VisitDetail): number {
  return visit.orders.reduce(
    (sum, order) => sum + order.tickets.reduce((count, ticket) => count + ticket.items.length, 0),
    0,
  );
}

export function readAttempt(data: unknown): PaymentAttempt | null {
  if (!data || typeof data !== "object" || !("details" in data)) return null;
  const parsed = PaymentAttemptSchema.safeParse(data.details);
  return parsed.success ? parsed.data : null;
}

function normalize(received: string): string {
  return received.trim().replaceAll(",", "");
}

// ponytail: tendered cash is display-only satang math. The server stores the bill amount.
export function cashShort(received: string, remaining: string): boolean {
  const value = normalize(received);
  if (!value) return false;
  if (!tendered.test(value)) return true;
  return cmpMoney(value, remaining) < 0;
}

export function changeAmount(received: string, remaining: string): string | null {
  const value = normalize(received);
  if (!value || cashShort(received, remaining)) return null;
  return fromSatang(toSatang(value) - toSatang(remaining));
}

export function canConfirm(reason: string, note: string): boolean {
  if (reason !== "direct_transfer" && reason !== "webhook_missing" && reason !== "other") return false;
  if (note.length > 500) return false;
  return reason !== "other" || note.trim().length > 0;
}
