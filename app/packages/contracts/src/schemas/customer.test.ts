import {
  CustomerCallStaffSchema,
  CustomerMenuItemSchema,
  CustomerMenuSchema,
  CustomerPaymentSchema,
  CustomerPlaceOrderSchema,
  CustomerSessionSchema,
  CustomerTabSchema,
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

describe('customer order, tab and call staff (BRIEF-048)', () => {
  it('drops a smuggled orderedByName from the order body', () => {
    const parsed = CustomerPlaceOrderSchema.parse({
      items: [{ variantId: ID, quantity: 1, orderedByName: 'เจ้าของร้าน' }],
    });
    expect(parsed.items[0]).not.toHaveProperty('orderedByName');
  });

  it('needs at least one line', () => {
    expect(CustomerPlaceOrderSchema.safeParse({ items: [] }).success).toBe(false);
  });

  it('refuses extra fields in the tab (no staff or session ids can ride along)', () => {
    const tab = { visitId: null, orders: [], total: '0.00', asOf: '2026-10-30T10:00:00.000Z' };
    expect(CustomerTabSchema.safeParse(tab).success).toBe(true);
    expect(CustomerTabSchema.safeParse({ ...tab, staffId: ID }).success).toBe(false);
  });

  it('accepts an empty call, a reason and a short note, but not a bad reason or a long note', () => {
    expect(CustomerCallStaffSchema.safeParse({}).success).toBe(true);
    expect(CustomerCallStaffSchema.safeParse({ reason: 'bill', note: 'เช็คบิล' }).success).toBe(true);
    expect(CustomerCallStaffSchema.safeParse({ reason: 'cash' }).success).toBe(false);
    expect(CustomerCallStaffSchema.safeParse({ note: 'ก'.repeat(101) }).success).toBe(false);
  });

  it('refuses a guest transfer bell and extra fields on the payment view', () => {
    expect(CustomerCallStaffSchema.safeParse({ reason: 'transfer' }).success).toBe(false);
    const payment = {
      bill: { total: '10.00', paid: '0.00', remaining: '10.00', locked: false },
      pending: null,
    };
    expect(CustomerPaymentSchema.safeParse(payment).success).toBe(true);
    expect(CustomerPaymentSchema.safeParse({ ...payment, staffId: ID }).success).toBe(false);
  });
});
