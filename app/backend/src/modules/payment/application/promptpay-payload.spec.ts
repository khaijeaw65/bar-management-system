import { promptPayPayload } from './promptpay-payload.js';

describe('PromptPay EMVCo payload', () => {
  it('matches known-good mobile and national-id vectors', () => {
    expect(promptPayPayload('0812345678', 'mobile', '1.23')).toBe(
      '00020101021229370016A000000677010111011300668123456785802TH530376454041.236304BFA6',
    );
    expect(promptPayPayload('1234567890123', 'national_id', '1240.00')).toBe(
      '00020101021229370016A000000677010111021312345678901235802TH530376454071240.0063040F75',
    );
  });

  it('uses CRC-16/CCITT-FALSE (init 0xFFFF)', () => {
    expect(promptPayPayload('0899999999', 'mobile', '1240.00')).toBe(
      '00020101021229370016A000000677010111011300668999999995802TH530376454071240.00630494E2',
    );
  });
});
