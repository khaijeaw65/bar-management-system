import { Inject, Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { PERMISSION_SOURCE, type PermissionSource } from '../domain/permission-source.js';

const RECHECK_MS = 60_000;

/**
 * Boot safety net (BRIEF-053): while no active staff member holds a live เจ้าของ membership, nobody could
 * ever grant permissions, so the guard logs would-be denials instead of throwing. Flips back as soon as an owner exists.
 */
@Injectable()
export class IamEnforcement implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(IamEnforcement.name);
  private enforcing = true;
  private checkedAt = 0;
  private lastWarnAt = 0;
  private timer: NodeJS.Timeout | undefined;

  public constructor(@Inject(PERMISSION_SOURCE) private readonly source: PermissionSource) {}

  public async onApplicationBootstrap(): Promise<void> {
    await this.refresh(new Date());
    this.timer = setInterval(() => void this.refresh(new Date()), RECHECK_MS);
    this.timer.unref();
  }

  public onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /** A fresh "enforcing" answer is trusted for a minute; a "not enforcing" answer is re-checked on every call. */
  public async isEnforcing(now: Date): Promise<boolean> {
    if (this.enforcing && now.getTime() - this.checkedAt < RECHECK_MS) return true;
    await this.refresh(now);
    return this.enforcing;
  }

  private async refresh(now: Date): Promise<void> {
    try {
      this.enforcing = await this.source.hasLiveOwner(now);
      this.checkedAt = now.getTime();
    } catch (error) {
      this.logger.error(`IAM owner check failed, keeping the last answer: ${String(error)}`);
      return;
    }
    if (!this.enforcing) this.warnOncePerMinute(now);
  }

  private warnOncePerMinute(now: Date): void {
    if (now.getTime() - this.lastWarnAt < RECHECK_MS) return;
    this.lastWarnAt = now.getTime();
    this.logger.warn('IAM: no owner — permissions NOT enforced');
  }
}
