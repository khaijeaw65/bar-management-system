import type { PromptpayIdType } from '@bar/contracts';

const PROMPTPAY_GUID = 'A000000677010111';

/** EMVCo merchant QR, field order matching Thai PromptPay scanners. CRC-16/CCITT-FALSE. */
export function promptPayPayload(id: string, idType: PromptpayIdType, amount: string): string {
  const body = [
    tlv('00', '01'),
    tlv('01', '12'),
    tlv('29', merchantAccount(id, idType)),
    tlv('58', 'TH'),
    tlv('53', '764'),
    tlv('54', amount),
  ].join('');
  return `${body}6304${crc16(`${body}6304`)}`;
}

function merchantAccount(id: string, idType: PromptpayIdType): string {
  const target = proxyTarget(id, idType);
  return tlv('00', PROMPTPAY_GUID) + tlv(target.tag, target.value);
}

function proxyTarget(id: string, idType: PromptpayIdType): { tag: string; value: string } {
  const digits = id.replace(/\D/g, '');
  if (idType === 'national_id') return { tag: '02', value: digits };
  if (idType === 'ewallet') return { tag: '03', value: digits };
  return { tag: '01', value: mobileProxy(digits) };
}

function mobileProxy(digits: string): string {
  const local = digits.replace(/^0/, '66');
  return `0000000000000${local}`.slice(-13);
}

function tlv(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, '0')}${value}`;
}

function crc16(payload: string): string {
  let crc = 0xffff;
  for (const char of payload) crc = crcByte(crc, char.charCodeAt(0));
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function crcByte(crc: number, byte: number): number {
  let next = crc ^ (byte << 8);
  for (let bit = 0; bit < 8; bit += 1) next = shiftCrc(next);
  return next;
}

function shiftCrc(crc: number): number {
  const high = (crc & 0x8000) !== 0;
  const shifted = (crc << 1) & 0xffff;
  if (!high) return shifted;
  return shifted ^ 0x1021;
}
