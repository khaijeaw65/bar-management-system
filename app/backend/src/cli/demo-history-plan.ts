import { businessDayStart } from '../common/business-date.js';
import type {
  DemoCatalog,
  DemoDay,
  DemoLine,
  DemoOrder,
  DemoPayment,
  DemoVisit,
  DemoRandom as Random,
} from './demo-history.types.js';

const MINUTE_MS = 60_000;
// Bills per weekday, Sunday = 0 … Saturday = 6 — Friday / Saturday peaks (CD-05 sample).
const BILLS_BY_WEEKDAY = [13, 11, 12, 14, 16, 28, 32];
const PROMPTPAY_SHARE = 0.7;
const MANUAL_SHARE = 0.08;

/** Same date → same plan, so a re-run writes the same rows (BRIEF-036 AC-6). */
export function planDay(businessDate: string, catalog: DemoCatalog): DemoDay {
  const random = seededRandom(Number(businessDate.replaceAll('-', '')));
  const weekday = new Date(`${businessDate}T00:00:00Z`).getUTCDay();
  const count = (BILLS_BY_WEEKDAY[weekday] ?? 12) + whole(random, 0, 4);
  const evening = businessDayStart(businessDate, '18:00').getTime();
  const visits = Array.from({ length: count }, () => planVisit(random, catalog, evening));
  cancelSomeLines(random, visits);
  return { businessDate, visits };
}

function planVisit(random: Random, catalog: DemoCatalog, evening: number): DemoVisit {
  const openedAt = evening + whole(random, 0, 420) * MINUTE_MS;
  const orders = Array.from({ length: whole(random, 1, 3) }, (_, index) =>
    planOrder(random, catalog, openedAt + (5 + index * whole(random, 20, 50)) * MINUTE_MS),
  );
  const lastOrder = orders.at(-1)?.at.getTime() ?? openedAt;
  return {
    seatId: pick(random, catalog.seatIds),
    openedAt: new Date(openedAt),
    closedAt: new Date(lastOrder + whole(random, 30, 80) * MINUTE_MS),
    orders,
    payment: planPayment(random),
  };
}

function planOrder(random: Random, catalog: DemoCatalog, at: number): DemoOrder {
  const lines = Array.from({ length: whole(random, 1, 3) }, () => ({
    variant: pick(random, catalog.variants),
    quantity: random() < 0.6 ? 1 : whole(random, 2, 3),
    cancelled: false,
  }));
  return { at: new Date(at), lines };
}

function planPayment(random: Random): DemoPayment {
  if (random() >= PROMPTPAY_SHARE) return { method: 'cash', confirmedVia: 'cash' };
  const confirmedVia = random() < MANUAL_SHARE ? 'manual' : 'slip_verify';
  return { method: 'promptpay', confirmedVia };
}

function cancelSomeLines(random: Random, visits: DemoVisit[]): void {
  const lines: DemoLine[] = visits.flatMap((visit) => visit.orders.flatMap((order) => order.lines));
  const cancelCount = whole(random, 1, 2);
  for (let index = 0; index < cancelCount; index += 1) pick(random, lines).cancelled = true;
}

function whole(random: Random, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function pick<T>(random: Random, values: readonly T[]): T {
  const value = values[Math.floor(random() * values.length)];
  if (value === undefined) throw new Error('demo history: nothing to pick from');
  return value;
}

/** mulberry32 — small deterministic PRNG, good enough for demo data. */
function seededRandom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
  };
}
