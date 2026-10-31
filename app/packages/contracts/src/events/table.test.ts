import { TableStaffCallClearedPayloadSchema } from './table.js';

const id = '11111111-1111-4111-8111-111111111111';

describe('table.staff_call_cleared', () => {
  it('accepts a staff acknowledger and a system clear', () => {
    const staff = { staffId: id, displayName: 'เอ' };
    expect(
      TableStaffCallClearedPayloadSchema.parse({ tableSeatId: id, acknowledgedBy: staff }),
    ).toEqual({ tableSeatId: id, acknowledgedBy: staff });
    expect(
      TableStaffCallClearedPayloadSchema.parse({ tableSeatId: id, acknowledgedBy: null }),
    ).toEqual({ tableSeatId: id, acknowledgedBy: null });
  });

  it('requires acknowledgedBy', () => {
    expect(TableStaffCallClearedPayloadSchema.safeParse({ tableSeatId: id }).success).toBe(false);
  });
});
