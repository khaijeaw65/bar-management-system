import { Inject, Injectable, Logger } from '@nestjs/common';
import { DomainException } from '../../../common/domain-exception.js';
import { CLOCK, type Clock } from '../../../common/clock.js';
import { TableSeatService } from '../../venue/application/table-seat.service.js';
import {
  GUEST_SESSION_REPOSITORY,
  type GuestSessionRepository,
} from '../domain/guest-session.repository.js';
import type {
  GuestSessionRow,
  GuestSessionView,
  StartedGuestSession,
} from '../domain/guest-session.types.js';
import { CustomerThrottle } from './customer-throttle.js';
import { hashGuestToken, newGuestToken } from './guest-token.js';

const SEAT_ONLY_LIFE_MS = 2 * 60 * 60 * 1000;
const LIVE_VISIT_STATES = ['open', 'active', 'idle'];
const SCANS_PER_MINUTE = 30;
const PURGE_BATCH = 100;

@Injectable()
export class GuestSessionService {
  private readonly logger = new Logger(GuestSessionService.name);

  public constructor(
    @Inject(GUEST_SESSION_REPOSITORY) private readonly sessions: GuestSessionRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly seats: TableSeatService,
    private readonly throttle: CustomerThrottle,
  ) {}

  /** Scan: reuse the cookie's session when it is on this seat, otherwise create one. */
  public async start(input: {
    qrToken: string;
    ip: string;
    rawToken: string | undefined;
  }): Promise<StartedGuestSession> {
    if (!(await this.throttle.allow(`customer:scan:${input.ip}`, SCANS_PER_MINUTE, 60))) {
      throw new DomainException('RATE_LIMITED', 'สแกนบ่อยเกินไป กรุณารอสักครู่', 429);
    }
    const found = await this.seats.findActiveSeatByQrToken(input.qrToken);
    if (!found) throw new DomainException('QR_INVALID', 'QR ไม่ถูกต้อง กรุณาติดต่อพนักงาน', 404);
    const existing = await this.tryResolve(input.rawToken);
    if (existing?.seat.id === found.seat.id) return { session: existing, token: null };
    const token = newGuestToken();
    const now = this.clock.now();
    const expiresAt = new Date(now.getTime() + SEAT_ONLY_LIFE_MS);
    const id = await this.sessions.insert({
      tokenHash: hashGuestToken(token),
      tableSeatId: found.seat.id,
      visitId: found.liveVisitId,
      expiresAt,
    });
    await this.purge(now);
    return {
      session: {
        id,
        seat: { id: found.seat.id, label: found.seat.label, kind: found.seat.kind },
        visitId: found.liveVisitId,
        displayName: null,
        expiresAt,
      },
      token,
    };
  }

  /** Guard entry point. A seat-only session that passes lives another 2 h (sliding). */
  public async resolve(rawToken: string | undefined): Promise<GuestSessionView> {
    const session = await this.tryResolve(rawToken);
    if (!session) {
      throw new DomainException('GUEST_SESSION_INVALID', 'เซสชันหมดอายุ กรุณาสแกน QR ที่โต๊ะอีกครั้ง', 401);
    }
    return session;
  }

  public async bindVisit(sessionId: string, visitId: string): Promise<void> {
    await this.sessions.bindVisit(sessionId, visitId);
  }

  public async rename(session: GuestSessionView, displayName: string | null): Promise<GuestSessionView> {
    await this.sessions.setDisplayName(session.id, displayName);
    return { ...session, displayName };
  }

  private async tryResolve(rawToken: string | undefined): Promise<GuestSessionView | null> {
    if (!rawToken) return null;
    const row = await this.sessions.findByTokenHash(hashGuestToken(rawToken));
    if (!row) return null;
    const now = this.clock.now();
    if (!this.isValid(row, now)) return null;
    if (row.visitId) return this.toView(row, row.expiresAt);
    const bound = await this.bindToLiveVisit(row);
    if (bound) return bound;
    const expiresAt = new Date(now.getTime() + SEAT_ONLY_LIFE_MS);
    await this.sessions.setExpiresAt(row.id, expiresAt);
    return this.toView(row, expiresAt);
  }

  // A phone that scanned a free seat keeps a seat-only session; once the table has a visit it joins it (DR-028).
  private async bindToLiveVisit(row: GuestSessionRow): Promise<GuestSessionView | null> {
    const visitId = await this.seats.findLiveVisitId(row.seat.id);
    if (!visitId) return null;
    await this.sessions.bindVisit(row.id, visitId);
    return { ...this.toView({ ...row, visitId }, row.expiresAt), justBound: true };
  }

  private isValid(row: GuestSessionRow, now: Date): boolean {
    if (!row.seat.isActive) return false;
    if (row.visitId) return row.visitState !== null && LIVE_VISIT_STATES.includes(row.visitState);
    return row.expiresAt.getTime() > now.getTime();
  }

  private toView(row: GuestSessionRow, expiresAt: Date): GuestSessionView {
    return {
      id: row.id,
      seat: { id: row.seat.id, label: row.seat.label, kind: row.seat.kind },
      visitId: row.visitId,
      displayName: row.displayName,
      expiresAt,
    };
  }

  /** Lazy cleanup of never-ordered sessions; a failure is logged and never fails the scan. */
  private async purge(now: Date): Promise<void> {
    try {
      await this.sessions.purgeExpired(now, PURGE_BATCH);
    } catch (error) {
      this.logger.warn(`guest session purge failed: ${error instanceof Error ? error.message : 'error'}`);
    }
  }
}
