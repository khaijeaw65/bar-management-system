import { z } from 'zod';
import { apiResponseSchema, IsoDateTimeSchema, MoneySchema } from './common.js';
import { MenuItemListResponseSchema } from './menu.js';

const itemId = '11111111-1111-4111-8111-111111111111';

describe('MoneySchema', () => {
  it('accepts a 2-decimal string', () => {
    expect(MoneySchema.parse('120.00')).toBe('120.00');
  });

  it.each([120, '120', '120.5', '120.000'])('rejects %s', (value) => {
    expect(MoneySchema.safeParse(value).success).toBe(false);
  });
});

describe('IsoDateTimeSchema', () => {
  it('accepts UTC and rejects a date-only string', () => {
    expect(IsoDateTimeSchema.parse('2026-09-28T11:04:00.000Z')).toBe(
      '2026-09-28T11:04:00.000Z',
    );
    expect(IsoDateTimeSchema.safeParse('2026-09-28').success).toBe(false);
  });
});

describe('apiResponseSchema', () => {
  const schema = apiResponseSchema(z.object({ id: z.string() }));
  const envelope = {
    status: 200,
    code: '',
    message: 'success',
    data: { id: '1' },
  };

  it('parses a success envelope', () => {
    expect(schema.parse(envelope)).toEqual(envelope);
  });

  it('rejects data of the wrong shape', () => {
    expect(schema.safeParse({ ...envelope, data: { id: 1 } }).success).toBe(
      false,
    );
  });

  it('rejects a missing envelope key', () => {
    const { code: _code, ...withoutCode } = envelope;
    expect(schema.safeParse(withoutCode).success).toBe(false);
  });
});

describe('MenuItemListResponseSchema', () => {
  it('parses a menu list envelope', () => {
    const body = {
      status: 200,
      code: '',
      message: 'success',
      data: {
        items: [
          {
            id: itemId,
            categoryId: itemId,
            name: 'สิงห์',
            description: null,
            imageUrl: null,
            itemType: 'simple',
            station: 'bar',
            isPromo: false,
            basePrice: '120.00',
            sortOrder: 0,
            availableNow: true,
            unavailableReason: null,
            windows: [],
            variants: [
              {
                id: itemId,
                name: 'ปกติ',
                price: '120.00',
                isAvailable: true,
                modifierGroups: [],
              },
            ],
          },
        ],
      },
    };
    expect(MenuItemListResponseSchema.parse(body)).toEqual(body);
  });
});
