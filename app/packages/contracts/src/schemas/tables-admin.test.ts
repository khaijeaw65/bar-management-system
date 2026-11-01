import { describe, expect, it } from 'vitest';
import {
  CreateSeatRequestSchema,
  ReorderSeatsRequestSchema,
  SeatAdminListSchema,
  SeatAdminSchema,
  UpdateSeatRequestSchema,
} from './tables-admin.js';

const UUID_1 = '11111111-1111-4111-8111-111111111111';
const UUID_2 = '22222222-2222-4222-8222-222222222222';

describe('SeatAdminSchema', () => {
  it('parses valid seat admin shape', () => {
    const raw = {
      id: UUID_1,
      label: ' T7 ',
      kind: 'table',
      sortOrder: 1,
      isActive: true,
      qrToken: 'some-token-at-least-43-chars-long-base64url',
      hasLiveVisit: false,
    };
    const parsed = SeatAdminSchema.parse(raw);
    expect(parsed.label).toBe('T7');
    expect(parsed.kind).toBe('table');
    expect(parsed.isActive).toBe(true);
    expect(parsed.hasLiveVisit).toBe(false);
  });

  it('rejects empty or overly long label', () => {
    expect(SeatAdminSchema.safeParse({
      id: UUID_1,
      label: '   ',
      kind: 'table',
      sortOrder: 1,
      isActive: true,
      qrToken: 'tok',
      hasLiveVisit: false,
    }).success).toBe(false);

    expect(SeatAdminSchema.safeParse({
      id: UUID_1,
      label: 'a'.repeat(21),
      kind: 'table',
      sortOrder: 1,
      isActive: true,
      qrToken: 'tok',
      hasLiveVisit: false,
    }).success).toBe(false);
  });
});

describe('SeatAdminListSchema', () => {
  it('parses empty and populated lists', () => {
    expect(SeatAdminListSchema.parse({ items: [] })).toEqual({ items: [] });
    const item = {
      id: UUID_1,
      label: 'C1',
      kind: 'counter',
      sortOrder: 0,
      isActive: true,
      qrToken: 'tok',
      hasLiveVisit: true,
    };
    expect(SeatAdminListSchema.parse({ items: [item] }).items).toHaveLength(1);
  });
});

describe('CreateSeatRequestSchema', () => {
  it('trims label and accepts valid kind', () => {
    const parsed = CreateSeatRequestSchema.parse({ label: '  T8  ', kind: 'table' });
    expect(parsed).toEqual({ label: 'T8', kind: 'table' });
  });

  it('rejects blank label', () => {
    expect(CreateSeatRequestSchema.safeParse({ label: '', kind: 'table' }).success).toBe(false);
    expect(CreateSeatRequestSchema.safeParse({ label: '   ', kind: 'table' }).success).toBe(false);
  });

  it('rejects invalid kind', () => {
    expect(CreateSeatRequestSchema.safeParse({ label: 'T1', kind: 'vip' }).success).toBe(false);
  });
});

describe('UpdateSeatRequestSchema', () => {
  it('accepts label only, kind only, or both', () => {
    expect(UpdateSeatRequestSchema.parse({ label: ' C2 ' })).toEqual({ label: 'C2' });
    expect(UpdateSeatRequestSchema.parse({ kind: 'counter' })).toEqual({ kind: 'counter' });
    expect(UpdateSeatRequestSchema.parse({ label: 'C2', kind: 'counter' })).toEqual({
      label: 'C2',
      kind: 'counter',
    });
  });

  it('rejects empty body', () => {
    expect(UpdateSeatRequestSchema.safeParse({}).success).toBe(false);
  });

  it('rejects blank label if provided', () => {
    expect(UpdateSeatRequestSchema.safeParse({ label: '   ' }).success).toBe(false);
  });
});

describe('ReorderSeatsRequestSchema', () => {
  it('accepts kind and array of UUIDs', () => {
    const parsed = ReorderSeatsRequestSchema.parse({
      kind: 'counter',
      ids: [UUID_1, UUID_2],
    });
    expect(parsed).toEqual({
      kind: 'counter',
      ids: [UUID_1, UUID_2],
    });
  });

  it('rejects invalid UUIDs', () => {
    expect(ReorderSeatsRequestSchema.safeParse({
      kind: 'counter',
      ids: ['invalid'],
    }).success).toBe(false);
  });
});
