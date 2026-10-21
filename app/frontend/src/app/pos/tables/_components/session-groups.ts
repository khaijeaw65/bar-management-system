import type { KitchenStation, Order, OrderLine, OrderStatus, Ticket, VisitState } from "@bar/contracts";

type ChipColor = "accent" | "danger" | "default" | "success" | "warning";

export interface SessionGroup {
  key: string;
  createdAt: string;
  orderNumber: number;
  stationLabel: string | null;
  chip: string;
  chipColor: ChipColor;
  lines: OrderLine[];
}

const visitLabel: Record<VisitState, string> = {
  open: "เปิดแล้ว",
  active: "มีแขก",
  idle: "ไม่มีความเคลื่อนไหว",
  closed: "ปิดโต๊ะ",
  abandoned: "ทิ้งโต๊ะ",
};

const statusLabel: Record<OrderStatus, string> = {
  pending: "ใหม่",
  accepted: "กำลังเตรียม",
  ready: "พร้อมเสิร์ฟ",
  sent: "เสิร์ฟแล้ว",
  issue: "มีปัญหา",
  cancelled: "ยกเลิกทั้งใบ",
};

const statusColor: Record<OrderStatus, ChipColor> = {
  pending: "warning",
  accepted: "accent",
  ready: "success",
  sent: "success",
  issue: "danger",
  cancelled: "danger",
};

export function visitChip(state: VisitState): string {
  return visitLabel[state];
}

export function hasMoney(value: string): boolean {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
}

function whollyCancelled(ticket: Ticket): boolean {
  return ticket.items.length > 0 && ticket.items.every((line) => line.cancelledAt !== null);
}

function chipOf(ticket: Ticket): { chip: string; chipColor: ChipColor } {
  if (ticket.status === "cancelled" || whollyCancelled(ticket)) {
    return { chip: "ยกเลิกทั้งใบ", chipColor: "danger" };
  }
  if (ticket.status === "accepted") {
    const name = ticket.acceptedBy?.displayName;
    return { chip: name ? `กำลังเตรียม · ${name}` : "กำลังเตรียม", chipColor: "accent" };
  }
  return { chip: statusLabel[ticket.status], chipColor: statusColor[ticket.status] };
}

function stationName(station: KitchenStation | null): string | null {
  if (station === "bar") return "บาร์";
  if (station === "food") return "ครัว";
  return null;
}

function grouped(order: Order): SessionGroup {
  const ticket = order.tickets[0];
  const chip = ticket ? chipOf(ticket) : { chip: statusLabel.pending, chipColor: statusColor.pending };
  return {
    key: order.id,
    createdAt: order.createdAt,
    orderNumber: order.orderNumber,
    stationLabel: null,
    chip: chip.chip,
    chipColor: chip.chipColor,
    lines: order.tickets.flatMap((item) => item.items),
  };
}

function split(order: Order, ticket: Ticket): SessionGroup {
  const chip = chipOf(ticket);
  return {
    key: ticket.id,
    createdAt: ticket.createdAt,
    orderNumber: order.orderNumber,
    stationLabel: stationName(ticket.station),
    chip: chip.chip,
    chipColor: chip.chipColor,
    lines: ticket.items,
  };
}

export function sessionGroups(orders: readonly Order[], kitchenOn: boolean): SessionGroup[] {
  const newest = [...orders].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  if (!kitchenOn) return newest.map(grouped);
  return newest.flatMap((order) => order.tickets.map((ticket) => split(order, ticket)));
}

// The line has no variant count. Show the name only when this group ordered more than one.
export function lineTitle(line: OrderLine, lines: readonly OrderLine[]): string {
  const base = `${line.quantity}× ${line.name}`;
  const names = new Set(lines.filter((item) => item.name === line.name).map((item) => item.variantName));
  if (names.size < 2) return base;
  return `${base} (${line.variantName})`;
}

export function lineNote(line: OrderLine): string | null {
  const parts = [
    ...line.modifiers.map((modifier) => modifier.name),
    line.notes,
    line.cancellation?.reason ?? null,
    line.orderedByName ? `สั่งโดย ${line.orderedByName}` : null,
  ].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" · ") : null;
}
