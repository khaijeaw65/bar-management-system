import { Injectable } from '@nestjs/common';
import type { CallStaffResult, CustomerCallStaff } from '@bar/contracts';
import { DomainException } from '../../../common/domain-exception.js';
import { blankToNull } from '../../../common/http/http-input.js';
import { TableSeatService } from '../../venue/application/table-seat.service.js';
import type { GuestSessionView } from '../domain/guest-session.types.js';
import { CustomerThrottle } from './customer-throttle.js';

const CALL_GAP_SECONDS = 60;

@Injectable()
export class CustomerCallService {
  public constructor(
    private readonly seats: TableSeatService,
    private readonly throttle: CustomerThrottle,
  ) {}

  public async call(guest: GuestSessionView, input: CustomerCallStaff): Promise<CallStaffResult> {
    if (!(await this.throttle.acquire(`customer:call:${guest.id}`, CALL_GAP_SECONDS))) {
      throw new DomainException('RATE_LIMITED', 'กรุณารอสักครู่ก่อนเรียกพนักงานอีกครั้ง', 429);
    }
    const calledAt = await this.seats.callStaff(guest.seat.id, {
      reason: input.reason ?? null,
      note: blankToNull(input.note),
    });
    return { calledAt: calledAt.toISOString() };
  }
}
