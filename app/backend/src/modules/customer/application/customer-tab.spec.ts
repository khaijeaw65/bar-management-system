import { CustomerTabSchema, type Order, type OrderLine } from '@bar/contracts';
import { emptyCustomerTab, foldCustomerTab } from './customer-tab.js';

const ID = '11111111-1111-4111-8111-111111111111';
const ME = '22222222-2222-4222-8222-222222222222';
const OTHER = '33333333-3333-4333-8333-333333333333';
const STAFF = { staffId: '44444444-4444-4444-8444-444444444444', displayName: 'พนักงานลับ' };
const AS_OF = new Date('2026-10-30T10:00:00.000Z');

function line(overrides: Partial<OrderLine> = {}): OrderLine {
  return {
    id: ID,
    variantId: ID,
    name: 'โอลด์แฟชั่น',
    variantName: 'ปกติ',
    quantity: 2,
    unitPrice: '260.00',
    modifiers: [{ optionId: ID, name: 'น้ำแข็งก้อนใหญ่', priceDelta: '10.00' }],
    lineTotal: '540.00',
    orderedByName: 'เอก',
    notes: 'ห้ามบอกใคร',
    cancelledAt: null,
    cancellation: null,
    ...overrides,
  };
}

function order(id: string, number: number, createdAt: string, total: string, items: OrderLine[], station: 'bar' | null = 'bar'): Order {
  return {
    id,
    visitId: ID,
    orderNumber: number,
    businessDate: '2026-10-30',
    createdAt,
    createdBy: STAFF,
    total,
    tickets: [
      {
        id,
        orderId: id,
        orderNumber: number,
        station,
        status: 'accepted',
        seat: { id: ID, label: 'T3', kind: 'table' },
        items,
        issue: null,
        acceptedBy: STAFF,
        sentAt: null,
        createdAt,
        updatedAt: createdAt,
      },
    ],
  };
}

const fold = (orders: Order[], placedBy: Map<string, string>) =>
  foldCustomerTab({ visitId: ID, orders, placedBy, sessionId: ME, asOf: AS_OF });

describe('foldCustomerTab (AC-6)', () => {
  const first = order('a0000000-0000-4000-8000-000000000001', 1, '2026-10-30T09:00:00.000Z', '540.00', [line()]);
  const second = order('a0000000-0000-4000-8000-000000000002', 2, '2026-10-30T09:30:00.000Z', '150.00', [
    line({ name: 'ค่าบริการ', quantity: 1, unitPrice: '150.00', lineTotal: '150.00', modifiers: [] }),
  ], null);

  it('lists the newest order first and marks only my own', () => {
    const tab = fold([first, second], new Map([[first.id, ME], [second.id, OTHER]]));
    expect(tab.orders.map((entry) => entry.orderNumber)).toEqual([2, 1]);
    expect(tab.orders.map((entry) => entry.mine)).toEqual([false, true]);
  });

  it('treats a staff order (no guest session) as not mine', () => {
    expect(fold([first], new Map()).orders[0]?.mine).toBe(false);
  });

  it('keeps the charge line but gives its ticket no status', () => {
    const tab = fold([second], new Map());
    expect(tab.orders[0]?.tickets).toEqual([]);
    expect(tab.orders[0]?.lines[0]).toMatchObject({ itemName: 'ค่าบริการ', cancelled: false });
  });

  it('shows a cancelled line struck and the total skips it', () => {
    const cancelled = order('a0000000-0000-4000-8000-000000000003', 3, '2026-10-30T09:40:00.000Z', '540.00', [
      line(),
      line({ cancelledAt: '2026-10-30T09:45:00.000Z', lineTotal: '300.00', quantity: 1, modifiers: [] }),
    ]);
    const tab = fold([first, cancelled], new Map());
    expect(tab.orders[0]?.lines.map((entry) => entry.cancelled)).toEqual([false, true]);
    expect(tab.total).toBe('1080.00');
  });

  it('parses strictly and carries no staff or session identity', () => {
    const tab = fold([first, second], new Map([[first.id, ME], [second.id, OTHER]]));
    expect(CustomerTabSchema.safeParse(tab).success).toBe(true);
    const text = JSON.stringify(tab);
    for (const secret of [STAFF.displayName, STAFF.staffId, ME, OTHER, 'ห้ามบอกใคร']) {
      expect(text).not.toContain(secret);
    }
    expect(tab.orders[0]?.lines[0]?.modifiers).toEqual([]);
    expect(tab.orders[1]?.lines[0]?.modifiers).toEqual(['น้ำแข็งก้อนใหญ่']);
  });

  it('gives a seat-only session an empty tab', () => {
    expect(emptyCustomerTab(AS_OF)).toEqual({ visitId: null, orders: [], total: '0.00', asOf: AS_OF.toISOString() });
  });
});
