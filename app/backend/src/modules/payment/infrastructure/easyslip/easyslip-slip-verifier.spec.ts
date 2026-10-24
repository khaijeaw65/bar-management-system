import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { EasySlipConfigService } from '../../../../providers/config/easyslip/config.service.js';
import { EasySlipSlipVerifier } from './easyslip-slip-verifier.js';

const fixture = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'easyslip-success.fixture.json'), 'utf8'),
) as Record<string, unknown>;

function verifier(apiKey = 'secret'): EasySlipSlipVerifier {
  return new EasySlipSlipVerifier({
    apiKey,
    baseUrl: 'https://api.easyslip.com/v2',
  } as EasySlipConfigService);
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('EasySlipSlipVerifier', () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];

  beforeEach(() => {
    calls.length = 0;
    vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return Promise.resolve(jsonResponse(200, fixture));
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps a v2 success body and sends the match flags', async () => {
    const result = await verifier().verify({ payload: 'QR-PAYLOAD' }, { expectedAmount: '1305.00' });
    expect(result).toEqual({
      kind: 'verified',
      transRef: '68370160657749I376388B35',
      amount: '1305.00',
      receiverMatch: 'matched',
    });
    expect(calls[0]?.url).toBe('https://api.easyslip.com/v2/verify/bank');
    expect(calls[0]?.init.headers).toMatchObject({
      authorization: 'Bearer secret',
      'content-type': 'application/json',
    });
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({
      payload: 'QR-PAYLOAD',
      matchAccount: true,
      matchAmount: 1305,
      checkDuplicate: false,
    });
    expect(calls[0]?.init.signal).toBeInstanceOf(AbortSignal);
  });

  it('sends a photo as base64', async () => {
    await verifier().verify({ image: 'QUJD' }, { expectedAmount: '10.00' });
    expect(JSON.parse(String(calls[0]?.init.body))).toMatchObject({ base64: 'QUJD', checkDuplicate: false });
  });

  it('treats a null matchedAccount as not matched and a missing one as unknown', async () => {
    const data = fixture.data as Record<string, unknown>;
    vi.stubGlobal('fetch', () => Promise.resolve(jsonResponse(200, { ...fixture, data: { ...data, matchedAccount: null } })));
    expect(await verifier().verify({ payload: 'QR' }, { expectedAmount: '10.00' })).toMatchObject({
      receiverMatch: 'not_matched',
    });
    vi.stubGlobal('fetch', () => {
      const { matchedAccount: _ignored, ...rest } = data;
      return Promise.resolve(jsonResponse(200, { ...fixture, data: rest }));
    });
    expect(await verifier().verify({ payload: 'QR' }, { expectedAmount: '10.00' })).toMatchObject({
      receiverMatch: 'unknown',
    });
  });

  it('maps a bad QR or image to invalid', async () => {
    for (const code of ['VALIDATION_ERROR', 'INVALID_IMAGE_FORMAT', 'IMAGE_SIZE_TOO_LARGE', 'INVALID_IMAGE_TYPE']) {
      vi.stubGlobal('fetch', () => Promise.resolve(jsonResponse(400, { success: false, error: { code, message: 'bad' } })));
      expect(await verifier().verify({ payload: 'QR' }, { expectedAmount: '10.00' })).toEqual({ kind: 'invalid' });
    }
  });

  it('maps slip-not-found and slip-pending', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(jsonResponse(404, { success: false, error: { code: 'SLIP_NOT_FOUND', message: 'missing' } })),
    );
    expect(await verifier().verify({ payload: 'QR' }, { expectedAmount: '10.00' })).toEqual({ kind: 'invalid' });
    vi.stubGlobal('fetch', () =>
      Promise.resolve(jsonResponse(404, { success: false, error: { code: 'SLIP_PENDING', message: 'wait' } })),
    );
    expect(await verifier().verify({ payload: 'QR' }, { expectedAmount: '10.00' })).toEqual({ kind: 'pending' });
  });

  it('maps auth, quota, server, timeout, a weird body, and a missing key to unavailable', async () => {
    for (const status of [401, 403, 429, 500]) {
      vi.stubGlobal('fetch', () => Promise.resolve(jsonResponse(status, { success: false, error: { code: 'NOPE' } })));
      expect(await verifier().verify({ payload: 'QR' }, { expectedAmount: '10.00' })).toEqual({ kind: 'unavailable' });
    }
    vi.stubGlobal('fetch', () => Promise.reject(new DOMException('timed out', 'TimeoutError')));
    expect(await verifier().verify({ payload: 'QR' }, { expectedAmount: '10.00' })).toEqual({ kind: 'unavailable' });
    vi.stubGlobal('fetch', () => Promise.resolve(jsonResponse(200, { success: true, data: {} })));
    expect(await verifier().verify({ payload: 'QR' }, { expectedAmount: '10.00' })).toEqual({ kind: 'unavailable' });
    const missed = verifier('');
    vi.stubGlobal('fetch', () => Promise.reject(new Error('should not be called')));
    expect(await missed.verify({ payload: 'QR' }, { expectedAmount: '10.00' })).toEqual({ kind: 'unavailable' });
  });
});
