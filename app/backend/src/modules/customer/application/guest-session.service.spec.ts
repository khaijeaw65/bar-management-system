import type { GuestSessionRepository } from '../domain/guest-session.repository.js';
import type { GuestSessionRow, NewGuestSession } from '../domain/guest-session.types.js';
import type { TableSeatService } from '../../venue/application/table-seat.service.js';
import { CustomerThrottle } from './customer-throttle.js';
import { GuestSessionService } from './guest-session.service.js';
import { hashGuestToken } from './guest-token.js';

const SEAT = '11111111-1111-4111-8111-111111111111';
const VISIT = '22222222-2222-4222-8222-222222222222';
const T0 = new Date('2026-10-29T10:00:00.000Z');
const HOUR = 60 * 60 * 1000;

class FakeSessions implements GuestSessionRepository {
  public rows = new Map<string, GuestSessionRow & { tokenHash: string }>();
  public purged: Array<[Date, number]> = [];
  public failPurge = false;

  public async insert(input: NewGuestSession): Promise<string> {
    const id = `session-${this.rows.size + 1}`;
    this.rows.set(id, {
      id,
      tokenHash: input.tokenHash,
      seat: { id: input.tableSeatId, label: 'T3', kind: 'table', isActive: true },
      visitId: input.visitId,
      visitState: input.visitId ? 'open' : null,
      displayName: null,
      expiresAt: input.expiresAt,
    });
    return id;
  }

  public async findByTokenHash(tokenHash: string): Promise<GuestSessionRow | null> {
    return [...this.rows.values()].find((row) => row.tokenHash === tokenHash) ?? null;
  }

  public async setExpiresAt(id: string, expiresAt: Date): Promise<void> {
    const row = this.rows.get(id);
    if (row) row.expiresAt = expiresAt;
  }

  public async setDisplayName(id: string, displayName: string | null): Promise<void> {
    const row = this.rows.get(id);
    if (row) row.displayName = displayName;
  }

  public async purgeExpired(before: Date, limit: number): Promise<number> {
    if (this.failPurge) throw new Error('db down');
    this.purged.push([before, limit]);
    return 0;
  }
}

function build(options: { liveVisitId?: string | null; allow?: boolean } = {}) {
  const sessions = new FakeSessions();
  let now = T0;
  const clock = { now: () => now };
  const seats = {
    findActiveSeatByQrToken: async (qr: string) =>
      qr === 'good'
        ? { seat: { id: SEAT, label: 'T3', kind: 'table', sortOrder: 1 }, liveVisitId: options.liveVisitId ?? null }
        : null,
  } as unknown as TableSeatService;
  const throttle = { allow: async () => options.allow ?? true } as unknown as CustomerThrottle;
  const service = new GuestSessionService(sessions, clock, seats, throttle);
  return { service, sessions, setNow: (value: Date) => (now = value) };
}

const scan = (rawToken?: string) => ({ qrToken: 'good', ip: '1.2.3.4', rawToken });

describe('GuestSessionService', () => {
  it('stores only the hash of the token it hands out (AC-1)', async () => {
    const { service, sessions } = build();
    const started = await service.start(scan());
    expect(started.token).toBeTruthy();
    const [row] = [...sessions.rows.values()];
    expect(row?.tokenHash).toBe(hashGuestToken(started.token ?? ''));
    expect(row?.tokenHash).toHaveLength(64);
    expect(JSON.stringify(row)).not.toContain(started.token ?? 'x');
    expect(started.session.expiresAt.getTime()).toBe(T0.getTime() + 2 * HOUR);
  });

  it('binds a new session to the live visit and gives each phone its own (AC-2)', async () => {
    const { service, sessions } = build({ liveVisitId: VISIT });
    const a = await service.start(scan());
    const b = await service.start(scan());
    expect(a.session.visitId).toBe(VISIT);
    expect(b.session.visitId).toBe(VISIT);
    expect(a.session.id).not.toBe(b.session.id);
    expect(sessions.rows.size).toBe(2);
  });

  it('reuses the cookie session on the same seat without a new row (AC-2)', async () => {
    const { service, sessions } = build();
    const first = await service.start(scan());
    const again = await service.start(scan(first.token ?? undefined));
    expect(again.token).toBeNull();
    expect(again.session.id).toBe(first.session.id);
    expect(sessions.rows.size).toBe(1);
  });

  it('rejects an unknown QR with QR_INVALID (AC-3)', async () => {
    const { service } = build();
    await expect(service.start({ qrToken: 'nope', ip: 'ip', rawToken: undefined })).rejects.toMatchObject({
      code: 'QR_INVALID',
      status: 404,
    });
  });

  it('rejects over the throttle with RATE_LIMITED (AC-3)', async () => {
    const { service } = build({ allow: false });
    await expect(service.start(scan())).rejects.toMatchObject({ code: 'RATE_LIMITED', status: 429 });
  });

  it('slides a seat-only session by 2 h from now (AC-5)', async () => {
    const { service, setNow } = build();
    const started = await service.start(scan());
    setNow(new Date(T0.getTime() + HOUR + 50 * 60 * 1000));
    const resolved = await service.resolve(started.token ?? undefined);
    expect(resolved.expiresAt.getTime()).toBe(T0.getTime() + 3 * HOUR + 50 * 60 * 1000);
  });

  it('rejects an expired seat-only session (AC-4)', async () => {
    const { service, setNow } = build();
    const started = await service.start(scan());
    setNow(new Date(T0.getTime() + 2 * HOUR + 1));
    await expect(service.resolve(started.token ?? undefined)).rejects.toMatchObject({
      code: 'GUEST_SESSION_INVALID',
      status: 401,
    });
  });

  it.each([undefined, '', 'garbage'])('rejects the cookie %j (AC-4)', async (cookie) => {
    const { service } = build();
    await expect(service.resolve(cookie)).rejects.toMatchObject({ code: 'GUEST_SESSION_INVALID' });
  });

  it('rejects a session on a closed visit or a deactivated seat (AC-4)', async () => {
    const { service, sessions } = build({ liveVisitId: VISIT });
    const started = await service.start(scan());
    const row = [...sessions.rows.values()][0];
    if (!row) throw new Error('no row');
    row.visitState = 'closed';
    await expect(service.resolve(started.token ?? undefined)).rejects.toMatchObject({ code: 'GUEST_SESSION_INVALID' });
    row.visitState = 'open';
    row.seat.isActive = false;
    await expect(service.resolve(started.token ?? undefined)).rejects.toMatchObject({ code: 'GUEST_SESSION_INVALID' });
  });

  it('does not slide a visit-bound session', async () => {
    const { service, setNow } = build({ liveVisitId: VISIT });
    const started = await service.start(scan());
    setNow(new Date(T0.getTime() + 5 * HOUR));
    const resolved = await service.resolve(started.token ?? undefined);
    expect(resolved.expiresAt.getTime()).toBe(T0.getTime() + 2 * HOUR);
  });

  it('purges after a scan and survives a purge failure (AC-8)', async () => {
    const { service, sessions } = build();
    await service.start(scan());
    expect(sessions.purged).toEqual([[T0, 100]]);
    sessions.failPurge = true;
    await expect(service.start(scan())).resolves.toBeTruthy();
  });

  it('renames the session (AC-6)', async () => {
    const { service, sessions } = build();
    const started = await service.start(scan());
    const renamed = await service.rename(started.session, 'ต้น');
    expect(renamed.displayName).toBe('ต้น');
    expect([...sessions.rows.values()][0]?.displayName).toBe('ต้น');
    expect((await service.rename(started.session, null)).displayName).toBeNull();
  });
});
