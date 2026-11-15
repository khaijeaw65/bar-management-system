import { describe, expect, it } from 'vitest';
import { PinHasher } from './pin-hasher.js';

describe('PinHasher', () => {
  it('hashes a 4-digit pin into a verifiable format under 100 characters', () => {
    const hash = PinHasher.hash('1234');
    expect(hash.length).toBeLessThanOrEqual(100);
    expect(PinHasher.verify('1234', hash)).toBe(true);
    expect(PinHasher.verify('9999', hash)).toBe(false);
    expect(PinHasher.verify('123', hash)).toBe(false);
  });

  it('generates unique salts across multiple hashes of the same pin', () => {
    const hash1 = PinHasher.hash('5678');
    const hash2 = PinHasher.hash('5678');
    expect(hash1).not.toBe(hash2);
    expect(PinHasher.verify('5678', hash1)).toBe(true);
    expect(PinHasher.verify('5678', hash2)).toBe(true);
  });

  it('returns false for malformed stored hash', () => {
    expect(PinHasher.verify('1234', '')).toBe(false);
    expect(PinHasher.verify('1234', 'invalid-hash')).toBe(false);
    expect(PinHasher.verify('1234', 'salt:not-hex-!!!')).toBe(false);
  });
});
