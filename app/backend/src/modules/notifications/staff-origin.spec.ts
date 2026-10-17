import type { IncomingMessage } from 'node:http';
import { allowStaffOrigin } from './staff-origin.js';

const FRONTEND = 'http://localhost:3000';

function request(origin?: string | string[]): IncomingMessage {
  return { headers: { origin } } as IncomingMessage;
}

describe('allowStaffOrigin', () => {
  it('allows a missing origin and the configured frontend', () => {
    const missing = vi.fn();
    const match = vi.fn();
    allowStaffOrigin(request(), FRONTEND, missing);
    allowStaffOrigin(request(FRONTEND), FRONTEND, match);
    expect(missing).toHaveBeenCalledWith(undefined, true);
    expect(match).toHaveBeenCalledWith(undefined, true);
  });

  it('rejects a foreign origin', () => {
    const decision = vi.fn();
    allowStaffOrigin(request('https://evil.example'), FRONTEND, decision);
    expect(decision).toHaveBeenCalledWith('origin not allowed', false);
  });
});
