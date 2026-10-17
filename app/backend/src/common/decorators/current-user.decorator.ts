import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { CurrentUserPayload } from './current-user.types.js';

/**
 * @CurrentUser() — the access-token identity attached by JwtAuthGuard.
 * Usage: handler(@CurrentUser() user: CurrentUserPayload)
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: CurrentUserPayload }>();
    return request.user;
  },
);
