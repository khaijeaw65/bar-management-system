import { ErrorCodeSchema } from './errors.js';
import { OpenVisitRequestSchema, TableSummarySchema } from './visits.js';

const seatId = '11111111-1111-4111-8111-111111111111';
const visitId = '22222222-2222-4222-8222-222222222222';

describe('visit contracts', () => {
  it('adds the close-transition error code', () => {
    expect(ErrorCodeSchema.options).toContain('INVALID_STATE_TRANSITION');
  });

  it('parses a free seat and an open request', () => {
    expect(
      TableSummarySchema.parse({
        id: seatId,
        label: 'C1',
        kind: 'counter',
        sortOrder: 1,
        currentVisit: {
          id: visitId,
          state: 'open',
          openedAt: '2026-10-17T12:00:00.000Z',
          guestLabel: null,
          total: '0.00',
          itemCount: 0,
          staffCalled: false,
        },
      }).label,
    ).toBe('C1');

    expect(OpenVisitRequestSchema.parse({ tableSeatId: seatId }).via).toBe(
      undefined,
    );
    expect(OpenVisitRequestSchema.safeParse({ via: 'qr' }).success).toBe(false);
  });
});
