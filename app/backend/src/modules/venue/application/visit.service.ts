import { Inject, Injectable } from '@nestjs/common';
import {
  VISIT_OPENED,
  VISIT_STATE_CHANGED,
  type TableSummary,
  type VisitState,
} from '@bar/contracts';
import { DomainException } from '../../../common/domain-exception.js';
import { StaffUserService } from '../../iam/application/staff-user.service.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import {
  TABLE_SEAT_REPOSITORY,
  type TableSeatRepository,
} from '../domain/table-seat.repository.js';
import {
  VISIT_REPOSITORY,
  type VisitRepository,
} from '../domain/visit.repository.js';
import type { VisitRecord } from '../domain/visit.types.js';
import { toTableSummary } from './table-summary.js';
import type {
  OpenVisitInput,
  OpenVisitResult,
  VisitOpenerView,
  VisitView,
} from './visit.types.js';

@Injectable()
export class VisitService {
  public constructor(
    @Inject(VISIT_REPOSITORY) private readonly visits: VisitRepository,
    @Inject(TABLE_SEAT_REPOSITORY) private readonly seats: TableSeatRepository,
    private readonly staffUsers: StaffUserService,
    private readonly notifications: NotificationsService,
  ) {}

  public async open(input: OpenVisitInput): Promise<OpenVisitResult> {
    await this.requireActiveSeat(input.tableSeatId);
    const result = await this.insertOrAttach(input);
    await this.emitOpened(result);
    return result;
  }

  public async getById(id: string): Promise<VisitView> {
    return this.toView(await this.requireVisit(id));
  }

  public async close(id: string): Promise<VisitView> {
    const current = await this.requireVisit(id);
    assertClosable(current);
    const closed = await this.visits.saveClosed(id, new Date());
    const view = await this.toView(closed);
    this.emitClosed(view);
    return view;
  }

  private async insertOrAttach(input: OpenVisitInput): Promise<OpenVisitResult> {
    const inserted = await this.visits.insert(input);
    if (inserted.kind === 'taken') return this.attachedVisit(input.tableSeatId);
    return { visit: await this.toView(inserted.visit), attached: false };
  }

  private async attachedVisit(tableSeatId: string): Promise<OpenVisitResult> {
    const live = await this.visits.findLiveBySeat(tableSeatId);
    if (!live) throw new DomainException('CONFLICT', 'สถานะโต๊ะไม่ถูกต้อง', 409);
    return { visit: await this.toView(live), attached: true };
  }

  private async emitOpened(result: OpenVisitResult): Promise<void> {
    if (result.attached) return;
    const summary = await this.summaryFor(result.visit.tableSeatId);
    if (!summary) return;
    this.notifications.emitToPos(VISIT_OPENED, summary);
  }

  private emitClosed(visit: VisitView): void {
    this.notifications.emitToPos(VISIT_STATE_CHANGED, {
      visitId: visit.id,
      tableSeatId: visit.tableSeatId,
      state: visit.state,
    });
  }

  private async summaryFor(tableSeatId: string): Promise<TableSummary | null> {
    const seats = await this.seats.listActive();
    const seat = seats.find((item) => item.id === tableSeatId);
    if (!seat) return null;
    return toTableSummary(seat);
  }

  private async requireActiveSeat(id: string): Promise<void> {
    const seat = await this.seats.findActiveById(id);
    if (!seat) throw new DomainException('NOT_FOUND', 'ไม่พบโต๊ะ', 404);
  }

  private async requireVisit(id: string): Promise<VisitRecord> {
    const visit = await this.visits.findById(id);
    if (!visit) throw new DomainException('NOT_FOUND', 'ไม่พบการเข้าใช้', 404);
    return visit;
  }

  private async toView(visit: VisitRecord): Promise<VisitView> {
    const seat = await this.seats.findById(visit.tableSeatId);
    if (!seat) throw new DomainException('NOT_FOUND', 'ไม่พบโต๊ะ', 404);
    return {
      ...visit,
      seatLabel: seat.label,
      seatKind: seat.kind,
      opener: await this.openerOf(visit.openedBy),
    };
  }

  private async openerOf(staffId: string | null): Promise<VisitOpenerView | null> {
    if (!staffId) return null;
    const staff = await this.staffUsers.findById(staffId);
    if (!staff) return null;
    return { staffId: staff.id, displayName: staff.displayName };
  }
}

function assertClosable(visit: VisitRecord): void {
  if (!isTerminal(visit.state)) return;
  throw new DomainException(
    'INVALID_STATE_TRANSITION',
    'สถานะโต๊ะไม่ถูกต้อง',
    409,
  );
}

function isTerminal(state: VisitState): boolean {
  return state === 'closed' || state === 'abandoned';
}
