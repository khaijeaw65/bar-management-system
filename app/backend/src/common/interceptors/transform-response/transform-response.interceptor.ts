import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import type { HttpResponseState } from './transform-response.types.js';

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  public intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    if (this.isRedirect(context)) return next.handle();
    return next.handle().pipe(
      map((data: unknown) => this.envelope(context, data)),
    );
  }

  private isRedirect(context: ExecutionContext): boolean {
    if (typeof context.getHandler !== 'function') return false;
    if (typeof Reflect.getMetadata !== 'function') return false;
    return Reflect.getMetadata('__redirect__', context.getHandler()) != null;
  }

  private envelope(context: ExecutionContext, data: unknown): unknown {
    const response = this.httpResponse(context);
    if (response.headersSent) return data;
    return {
      status: response.statusCode,
      code: '' as const,
      message: 'success' as const,
      data,
    };
  }

  private httpResponse(context: ExecutionContext): HttpResponseState {
    return context.switchToHttp().getResponse<HttpResponseState>();
  }
}
