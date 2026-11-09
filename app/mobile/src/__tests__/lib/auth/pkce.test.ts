import { createPkcePair, createPkceChallenge, toBase64Url } from '../../../lib/auth/pkce';

describe('PKCE Helper (AC-1)', () => {
  it('generates a 43-character base64url verifier and 43-character challenge', async () => {
    const pair = await createPkcePair();

    expect(pair.verifier).toHaveLength(43);
    expect(pair.challenge).toHaveLength(43);

    // base64url character set: [A-Za-z0-9_-]
    const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
    expect(pair.verifier).toMatch(base64UrlRegex);
    expect(pair.challenge).toMatch(base64UrlRegex);

    // Must not contain standard base64 characters +, /, or padding =
    expect(pair.verifier).not.toContain('+');
    expect(pair.verifier).not.toContain('/');
    expect(pair.verifier).not.toContain('=');

    expect(pair.challenge).not.toContain('+');
    expect(pair.challenge).not.toContain('/');
    expect(pair.challenge).not.toContain('=');
  });

  it('matches RFC 7636 Appendix B test vector for S256 challenge', async () => {
    // RFC 7636 Appendix B fixed test vector
    const rfcVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const expectedChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

    const challenge = await createPkceChallenge(rfcVerifier);
    expect(challenge).toBe(expectedChallenge);
  });

  it('correctly encodes Uint8Array to base64url without padding', () => {
    // 3 bytes [0, 0, 0] in base64 is 'AAAA', in base64url is 'AAAA'
    expect(toBase64Url(new Uint8Array([0, 0, 0]))).toBe('AAAA');

    // [251, 239] in base64 is '++8=', in base64url is '--8'
    expect(toBase64Url(new Uint8Array([251, 239]))).toBe('--8');

    // [255, 255] in base64 is '//8=', in base64url is '__8'
    expect(toBase64Url(new Uint8Array([255, 255]))).toBe('__8');
  });
});
