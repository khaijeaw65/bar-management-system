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
    const status = context
      .switchToHttp()
      .getResponse<{ statusCode: number }>().statusCode;
    return next.handle().pipe(
      map((data) => ({
        status,
        message: 'success' as const,
        data,
      })),
    );
  }
}
