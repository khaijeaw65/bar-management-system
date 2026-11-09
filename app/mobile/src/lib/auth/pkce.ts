import * as Crypto from 'expo-crypto';

export interface PkcePair {
  verifier: string;
  challenge: string;
}

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function toBase64Url(bytes: Uint8Array): string {
  let result = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i] ?? 0;
    const b1 = bytes[i + 1] ?? 0;
    const b2 = bytes[i + 2] ?? 0;

    const c0 = b0 >> 2;
    const c1 = ((b0 & 3) << 4) | (b1 >> 4);
    const c2 = ((b1 & 15) << 2) | (b2 >> 6);
    const c3 = b2 & 63;

    result += BASE64_CHARS.charAt(c0);
    result += BASE64_CHARS.charAt(c1);
    if (i + 1 < len) {
      result += BASE64_CHARS.charAt(c2);
    }
    if (i + 2 < len) {
      result += BASE64_CHARS.charAt(c3);
    }
  }

  return result
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export async function createPkceChallenge(verifier: string): Promise<string> {
  const base64Digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );
  return base64Digest
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function createPkcePair(): Promise<PkcePair> {
  const randomBytes = Crypto.getRandomBytes(32);
  const verifier = toBase64Url(randomBytes);
  const challenge = await createPkceChallenge(verifier);
  return { verifier, challenge };
}
