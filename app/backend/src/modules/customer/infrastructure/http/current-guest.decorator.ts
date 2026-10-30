import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { GuestSessionView } from '../../domain/guest-session.types.js';
import type { GuestRequest } from './guest-request.js';

/** @CurrentGuest() — the session `GuestSessionGuard` attached. */
export const CurrentGuest = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): GuestSessionView =>
    ctx.switchToHttp().getRequest<GuestRequest>().guestSession,
);
