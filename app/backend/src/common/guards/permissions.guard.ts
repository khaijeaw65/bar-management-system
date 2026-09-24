import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const PERMISSIONS_KEY = 'permissions';

/**
 * IAM guard — AWS-style most-permissive-wins.
 * Reads required permission(s) from @RequirePermissions() decorator,
 * then checks computed effective permissions from Redis ACL cache.
 *
 * Full implementation in iam module. This is the stub wired at app level.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No decorator → publicly accessible (after JwtAuthGuard)
    if (!required || required.length === 0) return true;

    // TODO: resolve effective permissions from Redis cache (IAM module)
    // Throw ForbiddenException if not satisfied
    throw new ForbiddenException('PermissionsGuard not yet fully implemented');
  }
}
