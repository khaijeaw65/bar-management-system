import { Injectable } from '@nestjs/common';
import { Clock } from '../../../common/clock.js';
import { PermissionResolver } from '../../iam/application/permission-resolver.service.js';

@Injectable()
export class NotificationRecipients {
  public constructor(
    private readonly resolver: PermissionResolver,
    private readonly clock: Clock,
  ) {}

  /**
   * AC-1: Given a POS order placed by staff P, returns active staff holding `orders:update_status`
   * with valid memberships now, excluding staff P.
   */
  public async orderNew(excludeStaffId?: string | null): Promise<string[]> {
    const holders = await this.resolver.staffHolding('orders:update_status', this.clock.now());
    if (!excludeStaffId) {
      return holders;
    }
    return holders.filter((id) => id !== excludeStaffId);
  }

  /**
   * AC-2: Given call-staff (reasons bill or other), returns active staff holding `tables:read`
   * with valid memberships now.
   */
  public async callStaff(): Promise<string[]> {
    return await this.resolver.staffHolding('tables:read', this.clock.now());
  }

  /**
   * AC-3: Given food-ready, returns the order creator if they hold `orders:read` at now.
   * If creator is null (QR order) or does not hold `orders:read`, returns active staff
   * holding `orders:update_status` at now.
   */
  public async foodReady(orderCreatorId?: string | null): Promise<string[]> {
    const now = this.clock.now();
    if (orderCreatorId) {
      const perms = await this.resolver.effectiveFor(orderCreatorId, now);
      if (perms.has('orders:read')) {
        return [orderCreatorId];
      }
    }
    return await this.resolver.staffHolding('orders:update_status', now);
  }
}
