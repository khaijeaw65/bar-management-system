import {
  CustomerMenuItemSchema,
  CustomerMenuSchema,
  CustomerSessionSchema,
  StartCustomerSessionSchema,
  UpdateCustomerSessionSchema,
} from './customer.js';
import { ErrorCodeSchema } from './errors.js';

const ID = '11111111-1111-4111-8111-111111111111';

const item = {
  id: ID,
  categoryId: ID,
  name: 'โอลด์แฟชั่น',
  description: null,
  imageUrl: null,
  isPromo: false,
  basePrice: '260.00',
  availableNow: true,
  unavailableReason: null,
  windows: [],
  variants: [{ id: ID, name: 'ปกติ', price: '260.00', isAvailable: true, modifierGroups: [] }],
};

describe('customer menu (AC-7)', () => {
  it('parses the slim item', () => {
    expect(CustomerMenuItemSchema.safeParse(item).success).toBe(true);
  });

  it.each(['station', 'itemType', 'sortOrder', 'updatedAt'])('rejects the POS-only field %s', (field) => {
    expect(CustomerMenuItemSchema.safeParse({ ...item, [field]: 'x' }).success).toBe(false);
  });

  it('rejects a POS-only category field', () => {
    const menu = { categories: [{ id: ID, name: 'เหล้า', sortOrder: 1, isActive: true }], items: [] };
    expect(CustomerMenuSchema.safeParse(menu).success).toBe(false);
  });
});

describe('customer session', () => {
  it('parses the session view', () => {
    const session = {
      seat: { id: ID, label: 'T3', kind: 'table' },
      visitId: null,
      displayName: null,
      expiresAt: '2026-10-29T12:00:00.000Z',
    };
    expect(CustomerSessionSchema.safeParse(session).success).toBe(true);
  });

  it('needs a qrToken of 1–64 characters', () => {
    expect(StartCustomerSessionSchema.safeParse({}).success).toBe(false);
    expect(StartCustomerSessionSchema.safeParse({ qrToken: '' }).success).toBe(false);
    expect(StartCustomerSessionSchema.safeParse({ qrToken: 'a'.repeat(65) }).success).toBe(false);
    expect(StartCustomerSessionSchema.safeParse({ qrToken: 'a'.repeat(64) }).success).toBe(true);
  });

  it('trims the nickname and bounds it at 30 (AC-6)', () => {
    expect(UpdateCustomerSessionSchema.parse({ displayName: '  ต้น  ' }).displayName).toBe('ต้น');
    expect(UpdateCustomerSessionSchema.parse({ displayName: '   ' }).displayName).toBe('');
    expect(UpdateCustomerSessionSchema.parse({ displayName: null }).displayName).toBeNull();
    expect(UpdateCustomerSessionSchema.safeParse({ displayName: 'a'.repeat(31) }).success).toBe(false);
    expect(UpdateCustomerSessionSchema.safeParse({ displayName: 'a'.repeat(30) }).success).toBe(true);
  });
});

describe('customer error codes', () => {
  it('lists QR_INVALID and GUEST_SESSION_INVALID', () => {
    expect(ErrorCodeSchema.safeParse('QR_INVALID').success).toBe(true);
    expect(ErrorCodeSchema.safeParse('GUEST_SESSION_INVALID').success).toBe(true);
  });
});
