import { getFreshMockTickets } from '../../../mocks/tickets';
import { seatLine, splitOrderIds } from '../../../lib/tickets/seat-line';

describe('seat line (AC-4, R18)', () => {
  const items = getFreshMockTickets().items;
  const byNumber = (n: number) => items.filter((t) => t.orderNumber === n);

  it('finds orders with more than one ticket in the list', () => {
    const split = splitOrderIds(items);
    const [first] = byNumber(42);
    if (!first) throw new Error('fixture missing');
    expect([...split]).toEqual([first.orderId]);
  });

  it('a split order shows the station on both cards', () => {
    const [bar, food] = byNumber(42);
    if (!bar || !food) throw new Error('fixture missing');
    expect(seatLine(bar, true)).toBe('T1 · ต้น · บาร์');
    expect(seatLine(food, true)).toBe('T1 · ต้น · ครัว');
  });

  it('a single-ticket order shows no station label', () => {
    const [single] = byNumber(44);
    if (!single) throw new Error('fixture missing');
    expect(seatLine(single, false)).not.toMatch(/บาร์|ครัว/);
    expect(seatLine(single, false).startsWith('T3')).toBe(true);
  });

  it('missing orderedByName → table only', () => {
    const [single] = byNumber(44);
    if (!single) throw new Error('fixture missing');
    const noName = { ...single, items: single.items.map((i) => ({ ...i, orderedByName: null })) };
    expect(seatLine(noName, false)).toBe('T3');
  });
});
