import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { CustomerTabGateway } from '../../application/customer-tab-gateway.js';
import { GuestSessionService } from '../../application/guest-session.service.js';
import { GUEST_COOKIE } from './guest-cookie.js';
import type { GuestRequest } from './guest-request.js';

/** Authenticates `/customer/*` by the `guest_session` cookie only — never the staff access token. */
@Injectable()
export class GuestSessionGuard implements CanActivate {
  public constructor(
    private readonly sessions: GuestSessionService,
    private readonly tabGateway: CustomerTabGateway,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<GuestRequest>();
    const session = await this.sessions.resolve(request.cookies?.[GUEST_COOKIE]);
    // Bound by this request: its open sockets move from the seat room to the visit room.
    if (session.justBound && session.visitId) await this.tabGateway.bindSession(session.id, session.visitId);
    request.guestSession = session;
    return true;
  }
}
