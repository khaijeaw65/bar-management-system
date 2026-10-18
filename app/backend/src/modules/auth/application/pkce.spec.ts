import { verifyPkceS256 } from './pkce.js';

// RFC 7636 Appendix B.
const VERIFIER = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
const CHALLENGE = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

describe('verifyPkceS256', () => {
  it('accepts the RFC 7636 Appendix B vector', () => {
    expect(verifyPkceS256(VERIFIER, CHALLENGE)).toBe(true);
  });

  it('rejects a verifier that does not match the challenge', () => {
    expect(verifyPkceS256(`${VERIFIER}x`, CHALLENGE)).toBe(false);
    expect(verifyPkceS256(VERIFIER, `${CHALLENGE}x`)).toBe(false);
  });
});
