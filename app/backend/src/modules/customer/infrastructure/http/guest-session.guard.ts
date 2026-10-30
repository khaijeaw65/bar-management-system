import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GuestSessionService } from '../../application/guest-session.service.js';
import { GUEST_COOKIE } from './guest-cookie.js';
import type { GuestRequest } from './guest-request.js';

/** Authenticates `/customer/*` by the `guest_session` cookie only — never the staff access token. */
@Injectable()
export class GuestSessionGuard implements CanActivate {
  public constructor(private readonly sessions: GuestSessionService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<GuestRequest>();
    request.guestSession = await this.sessions.resolve(request.cookies?.[GUEST_COOKIE]);
    return true;
  }
}
