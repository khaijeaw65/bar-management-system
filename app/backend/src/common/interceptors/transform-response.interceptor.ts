import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (isRedirect(context)) return next.handle();
    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse<{
          statusCode: number;
          headersSent?: boolean;
        }>();
        if (response.headersSent) return data;
        return {
          status: response.statusCode,
          code: '' as const,
          message: 'success' as const,
          data,
        };
      }),
    );
  }
}

function isRedirect(context: ExecutionContext): boolean {
  if (typeof context.getHandler !== 'function') return false;
  if (typeof Reflect.getMetadata !== 'function') return false;
  return Reflect.getMetadata('__redirect__', context.getHandler()) != null;
}
