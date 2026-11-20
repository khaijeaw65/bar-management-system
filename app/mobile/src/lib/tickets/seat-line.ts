import type { Ticket } from '@bar/contracts';

const STATION_LABEL: Record<NonNullable<Ticket['station']>, string> = {
  bar: 'บาร์',
  food: 'ครัว',
};

/** Order ids that appear as more than one ticket in the list (a split order, R18). */
export function splitOrderIds(tickets: readonly Pick<Ticket, 'orderId'>[]): Set<string> {
  const counts = new Map<string, number>();
  for (const t of tickets) {
    counts.set(t.orderId, (counts.get(t.orderId) ?? 0) + 1);
  }
  return new Set([...counts].filter(([, n]) => n > 1).map(([id]) => id));
}

/** "T3 · ต้น", plus "· บาร์" / "· ครัว" only when the order is split across stations (R18). */
export function seatLine(ticket: Pick<Ticket, 'seat' | 'items' | 'station'>, isSplit: boolean): string {
  const orderedBy = ticket.items.find((item) => item.orderedByName)?.orderedByName;
  const station = isSplit && ticket.station ? STATION_LABEL[ticket.station] : undefined;
  return [ticket.seat.label, orderedBy, station].filter(Boolean).join(' · ');
}
