import { DomainException } from '../../../common/domain-exception.js';
import { maskPromptPayId, normalizePromptPayId } from './promptpay-id.js';

const VALID_NATIONAL_ID = '1111111111119';

describe('PromptPay ID', () => {
  it('stores digits and masks the last four for every type', () => {
    expect(normalizePromptPayId('081-234-5678', 'mobile')).toEqual({
      promptpayId: '0812345678',
      promptpayIdType: 'mobile',
    });
    expect(normalizePromptPayId('081 234 5678', 'mobile').promptpayId).toBe('0812345678');
    expect(maskPromptPayId('0812345678')).toBe('XXX-XXX-5678');
    expect(maskPromptPayId(VALID_NATIONAL_ID)).toBe('XXX-XXX-1119');
    expect(maskPromptPayId('123456789012345')).toBe('XXX-XXX-2345');
    expect(maskPromptPayId(null)).toBeNull();
  });

  it('accepts a national ID with a valid check digit and a 15-digit e-wallet', () => {
    expect(normalizePromptPayId(VALID_NATIONAL_ID, 'national_id').promptpayId).toBe(VALID_NATIONAL_ID);
    expect(normalizePromptPayId('123456789012345', 'ewallet').promptpayId).toBe('123456789012345');
  });

  it('rejects a bad format, a bad check digit, and a type mismatch', () => {
    expectInvalid('812345678', 'mobile');
    expectInvalid('081234567', 'mobile');
    expectInvalid('1812345678', 'mobile');
    expectInvalid('08123456789', 'mobile');
    expectInvalid('08123a5678', 'mobile');
    expectInvalid('', 'mobile');
    expectInvalid('1111111111118', 'national_id');
    expectInvalid('0812345678', 'national_id');
    expectInvalid(VALID_NATIONAL_ID, 'mobile');
    expectInvalid('0812345678', 'ewallet');
    expectInvalid('12345678901234', 'ewallet');
  });
});

function expectInvalid(raw: string, type: 'mobile' | 'national_id' | 'ewallet'): void {
  expect(() => normalizePromptPayId(raw, type)).toThrow(DomainException);
  try {
    normalizePromptPayId(raw, type);
  } catch (error) {
    expect(error).toMatchObject({ code: 'VALIDATION_ERROR', message: 'รูปแบบพร้อมเพย์ไม่ถูกต้อง' });
    expect((error as DomainException).getStatus()).toBe(400);
    if (raw.length > 0) expect((error as DomainException).message).not.toContain(raw);
  }
}
