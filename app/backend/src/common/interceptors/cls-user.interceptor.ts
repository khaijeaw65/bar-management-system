import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { Observable } from 'rxjs';
import type { CurrentUserPayload } from '../decorators/current-user.types.js';

/**
 * Seeds the CLS store with the current user's ID on every request.
 * Must run after JwtAuthGuard so request.user is populated.
 * AuditSubscriber reads cls.get('userId') to stamp createdBy/updatedBy.
 */
@Injectable()
export class ClsUserInterceptor implements NestInterceptor {
  public constructor(private readonly cls: ClsService) {}

  public intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: CurrentUserPayload }>();

    if (request.user?.sub) {
      this.cls.set('userId', request.user.sub);
    }

    return next.handle();
  }
}
