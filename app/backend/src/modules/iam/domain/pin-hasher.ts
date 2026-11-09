import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export class PinHasher {
  private static readonly KEY_LEN = 32;
  private static readonly SALT_LEN = 16;

  public static hash(pin: string): string {
    const salt = randomBytes(PinHasher.SALT_LEN).toString('hex');
    const derived = scryptSync(pin, salt, PinHasher.KEY_LEN);
    return `${salt}:${derived.toString('hex')}`;
  }

  public static verify(pin: string, storedHash: string): boolean {
    const parts = storedHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, keyHex] = parts;
    if (!salt || !keyHex) return false;
    if (!/^[0-9a-f]{32}$/i.test(salt) || !/^[0-9a-f]{64}$/i.test(keyHex)) return false;
    try {
      const expected = Buffer.from(keyHex, 'hex');
      const derived = scryptSync(pin, salt, expected.length);
      return timingSafeEqual(expected, derived);
    } catch {
      return false;
    }
  }
}
