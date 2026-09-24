import type { INestApplication } from '@nestjs/common';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter.js';
import { TransformResponseInterceptor } from '../common/interceptors/transform-response.interceptor.js';

export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformResponseInterceptor());
}
