import type { PromptpayIdType } from '@bar/contracts';
import { DomainException } from '../../../common/domain-exception.js';
import type { StoredPromptPay } from '../domain/venue.repository.js';

const INVALID = new DomainException('VALIDATION_ERROR', 'รูปแบบพร้อมเพย์ไม่ถูกต้อง', 400);

export function normalizePromptPayId(raw: string, type: PromptpayIdType): StoredPromptPay {
  const digits = digitsOnly(raw);
  if (!matchesType(digits, type)) throw INVALID;
  return { promptpayId: digits, promptpayIdType: type };
}

export function maskPromptPayId(id: string | null): string | null {
  if (!id) return null;
  return `XXX-XXX-${id.slice(-4)}`;
}

function digitsOnly(raw: string): string {
  if (!/^[\d\s-]+$/.test(raw)) throw INVALID;
  return raw.replace(/[\s-]/g, '');
}

function matchesType(digits: string, type: PromptpayIdType): boolean {
  if (type === 'mobile') return /^0\d{9}$/.test(digits);
  if (type === 'ewallet') return /^\d{15}$/.test(digits);
  return isThaiNationalId(digits);
}

function isThaiNationalId(digits: string): boolean {
  if (!/^\d{13}$/.test(digits)) return false;
  return checkDigit(digits) === Number(digits[12]);
}

function checkDigit(digits: string): number {
  const sum = digits
    .slice(0, 12)
    .split('')
    .reduce((total, digit, index) => total + Number(digit) * (13 - index), 0);
  return (11 - (sum % 11)) % 10;
}
