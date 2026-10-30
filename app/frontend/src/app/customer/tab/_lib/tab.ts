import type { CustomerTabOrder, CustomerTabTicket, OrderStatus } from "@bar/contracts";

export type TabFilter = "all" | "mine";

// Customer wording for a ticket's status (CD-06 §8, DR-012). `issue` is staff-side trouble: the guest just sees "preparing".
export const TICKET_LABEL: Record<Exclude<OrderStatus, "cancelled">, string> = {
  pending: "ส่งแล้ว",
  accepted: "ร้านกำลังเตรียม",
  ready: "พร้อมเสิร์ฟ",
  sent: "เสิร์ฟแล้ว",
  issue: "ร้านกำลังเตรียม",
};

export const STATION_LABEL = { bar: "บาร์", food: "ครัว" } as const;

export function visibleTickets(tickets: readonly CustomerTabTicket[]): CustomerTabTicket[] {
  return tickets.filter((ticket) => ticket.status !== "cancelled");
}

export function filterOrders(orders: readonly CustomerTabOrder[], filter: TabFilter): CustomerTabOrder[] {
  return filter === "mine" ? orders.filter((order) => order.mine) : [...orders];
}

const clock = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });

export function clockOf(iso: string): string {
  return clock.format(new Date(iso));
}
