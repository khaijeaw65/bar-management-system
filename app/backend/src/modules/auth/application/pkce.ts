import { createHash, timingSafeEqual } from 'node:crypto';

// Equal-length compare so a wrong verifier does not leak through timing.
export function verifyPkceS256(
  codeVerifier: string,
  codeChallenge: string,
): boolean {
  const digest = createHash('sha256').update(codeVerifier).digest('base64url');
  const actual = Buffer.from(digest);
  const expected = Buffer.from(codeChallenge);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
