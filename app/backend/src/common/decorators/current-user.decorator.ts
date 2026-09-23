import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
  sub: string;       // staff_user.id
  role: string;      // StaffRole
  venueId: string;
}

/**
 * @CurrentUser() — extracts the JWT payload attached by JwtAuthGuard.
 * Usage: handler(@CurrentUser() user: CurrentUserPayload)
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: CurrentUserPayload }>();
    return request.user;
  },
);
