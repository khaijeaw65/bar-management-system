import { menuAvailability } from './menu-availability.js';

const DAILY = {
  daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
  startTime: '17:00',
  endTime: '21:00',
};

const WEEKEND_NIGHT = {
  daysOfWeek: [5, 6],
  startTime: '22:00',
  endTime: '02:00',
};

function at(local: string): Date {
  return new Date(`${local}+07:00`);
}

describe('menuAvailability', () => {
  it('is available when the item has no window', () => {
    const decision = menuAvailability(
      { categoryActive: true, isAvailable: true, windows: [] },
      at('2026-10-16T03:00:00'),
    );
    expect(decision).toEqual({
      listed: true,
      availableNow: true,
      unavailableReason: null,
    });
  });

  it('reports sold_out when the flag is off, even outside a window', () => {
    const decision = menuAvailability(
      { categoryActive: true, isAvailable: false, windows: [DAILY] },
      at('2026-10-16T22:00:00'),
    );
    expect(decision.availableNow).toBe(false);
    expect(decision.unavailableReason).toBe('sold_out');
  });

  it('treats 17:00–21:00 as inclusive at the start and exclusive at the end', () => {
    const input = {
      categoryActive: true,
      isAvailable: true,
      windows: [DAILY],
    };
    expect(menuAvailability(input, at('2026-10-16T20:59:00'))).toMatchObject({
      availableNow: true,
      unavailableReason: null,
    });
    expect(menuAvailability(input, at('2026-10-16T21:00:00'))).toMatchObject({
      availableNow: false,
      unavailableReason: 'out_of_window',
    });
  });

  it('keeps a Friday 22:00–02:00 window open through Saturday morning', () => {
    const input = {
      categoryActive: true,
      isAvailable: true,
      windows: [WEEKEND_NIGHT],
    };
    expect(menuAvailability(input, at('2026-10-16T23:00:00')).availableNow).toBe(
      true,
    );
    expect(menuAvailability(input, at('2026-10-17T01:00:00')).availableNow).toBe(
      true,
    );
    expect(menuAvailability(input, at('2026-10-17T02:00:00')).availableNow).toBe(
      false,
    );
    expect(menuAvailability(input, at('2026-10-15T23:00:00')).availableNow).toBe(
      false,
    );
    expect(menuAvailability(input, at('2026-10-18T01:00:00')).availableNow).toBe(
      true,
    );
  });

  it('does not list an item whose category is inactive', () => {
    const decision = menuAvailability(
      { categoryActive: false, isAvailable: true, windows: [] },
      at('2026-10-16T19:00:00'),
    );
    expect(decision.listed).toBe(false);
    expect(decision.availableNow).toBe(false);
  });
});
