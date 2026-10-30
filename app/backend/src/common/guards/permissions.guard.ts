import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { PermissionCode } from '@bar/contracts';
import { IamEnforcement } from '../../modules/iam/application/iam-enforcement.service.js';
import { PermissionResolver } from '../../modules/iam/application/permission-resolver.service.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import type { CurrentUserPayload } from '../decorators/current-user.types.js';
import { DomainException } from '../domain-exception.js';

export const PERMISSIONS_KEY = 'permissions';

/**
 * IAM guard — AWS-style most-permissive-wins. Runs after JwtAuthGuard (both are APP_GUARDs in AppModule, in that order).
 * Reads @RequirePermissions(), asks the resolver for the caller's effective set, and answers 403 with the missing codes.
 * A route with no decorator is open to any logged-in staff; the route-coverage test forces that to be explicit (@AnyStaff).
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  public constructor(
    private readonly reflector: Reflector,
    private readonly resolver: PermissionResolver,
    private readonly enforcement: IamEnforcement,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) return true;
    const required = this.reflector.getAllAndOverride<PermissionCode[] | undefined>(PERMISSIONS_KEY, targets);
    if (!required || required.length === 0) return true;

    const user = context.switchToHttp().getRequest<{ user?: CurrentUserPayload }>().user;
    if (!user) throw new UnauthorizedException();
    const now = new Date();
    const held = await this.resolver.effectiveFor(user.sub, now);
    const missing = required.filter((code) => !held.has(code));
    if (missing.length === 0) return true;

    if (!(await this.enforcement.isEnforcing(now))) {
      this.logger.warn(`IAM not enforced (no owner): would deny ${user.sub}, missing ${missing.join(', ')}`);
      return true;
    }
    throw new DomainException('FORBIDDEN', 'ไม่มีสิทธิ์ใช้งานส่วนนี้', 403, { missing });
  }
}
