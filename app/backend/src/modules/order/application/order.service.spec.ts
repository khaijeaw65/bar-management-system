import type { MenuModifierGroup } from '@bar/contracts';
import type {
  OrderableLookup,
  OrderableVariant,
} from '../../menu/application/menu-catalog.service.js';
import { DomainException } from '../../../common/domain-exception.js';
import { priceLines } from './order-lines.js';
import type { RequestedLine } from './order.types.js';

const ICE = '11111111-1111-4111-8111-111111111111';
const CHERRY = '22222222-2222-4222-8222-222222222222';
const OTHER = '33333333-3333-4333-8333-333333333333';
const VARIANT = '44444444-4444-4444-8444-444444444444';

const groups: MenuModifierGroup[] = [
  {
    id: '55555555-5555-4555-8555-555555555555',
    name: 'น้ำแข็ง',
    isRequired: true,
    minSelect: 1,
    maxSelect: 1,
    options: [
      { id: ICE, name: 'ปกติ', priceDelta: '0.00', isAvailable: true },
      { id: OTHER, name: 'หมด', priceDelta: '0.00', isAvailable: false },
    ],
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    name: 'เพิ่ม',
    isRequired: false,
    minSelect: 0,
    maxSelect: 1,
    options: [{ id: CHERRY, name: 'เชอร์รี่', priceDelta: '20.00', isAvailable: true }],
  },
];

function variant(overrides: Partial<OrderableVariant> = {}): OrderableVariant {
  return {
    variantId: VARIANT,
    price: '260.00',
    itemName: 'โอลด์แฟชั่น',
    variantName: 'ปกติ',
    itemType: 'simple',
    kitchenTag: 'bar',
    availableNow: true,
    unavailableReason: null,
    modifierGroups: groups,
    ...overrides,
  };
}

function line(modifierOptionIds: string[]): RequestedLine {
  return {
    variantId: VARIANT,
    quantity: 1,
    modifierOptionIds,
    orderedByName: null,
    notes: null,
  };
}

function lookup(found: OrderableVariant[] = [variant()]): OrderableLookup {
  return { found, missing: [] };
}

describe('priceLines', () => {
  it('snapshots the variant price and a modifier delta', () => {
    const [priced] = priceLines([line([ICE, CHERRY])], lookup());
    expect(priced?.unitPrice).toBe('260.00');
    expect(priced?.modifiers.map((modifier) => modifier.priceDelta)).toEqual(['0.00', '20.00']);
  });

  it('freezes the names and numbers the lines 1 … n in request order', () => {
    const priced = priceLines([line([ICE, CHERRY]), line([ICE]), line([ICE])], lookup());
    expect(priced.map((item) => item.lineNo)).toEqual([1, 2, 3]);
    expect(priced[0]).toMatchObject({ itemName: 'โอลด์แฟชั่น', variantName: 'ปกติ' });
    expect(priced[0]?.modifiers.map((modifier) => modifier.name)).toEqual(['ปกติ', 'เชอร์รี่']);
  });

  it('rejects a required group that was skipped', () => {
    expect(() => priceLines([line([])], lookup())).toThrow(DomainException);
  });

  it('rejects an option from another group', () => {
    const foreign = '77777777-7777-4777-8777-777777777777';
    expect(() => priceLines([line([ICE, foreign])], lookup())).toThrow(DomainException);
  });

  it('rejects a switched-off option like an unknown one (BRIEF-044)', () => {
    try {
      priceLines([line([OTHER])], lookup());
      throw new Error('expected VALIDATION_ERROR');
    } catch (error) {
      expect(error).toBeInstanceOf(DomainException);
      expect((error as DomainException).code).toBe('VALIDATION_ERROR');
    }
  });

  it('blocks a required group whose options are all switched off', () => {
    const [group] = groups;
    if (!group) throw new Error('fixture');
    const dead = { ...group, options: group.options.map((option) => ({ ...option, isAvailable: false })) };
    expect(() => priceLines([line([])], lookup([variant({ modifierGroups: [dead] })]))).toThrow(DomainException);
  });

  it('reports an item outside its window', () => {
    const closed = variant({ availableNow: false, unavailableReason: 'out_of_window' });
    expect(() => priceLines([line([ICE])], lookup([closed]))).toThrow(DomainException);
    try {
      priceLines([line([ICE])], lookup([closed]));
    } catch (error) {
      expect((error as DomainException).errorData).toEqual({
        details: [{ variantId: VARIANT, reason: 'out_of_window' }],
      });
    }
  });
});
