import type { INestApplication } from '@nestjs/common';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter.js';
import { TransformResponseInterceptor } from '../common/interceptors/transform-response.interceptor.js';
import { setupOpenApi } from '../common/openapi/setup-openapi.js';
import { OpenApiConfigService } from '../providers/config/openapi/config.service.js';

export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformResponseInterceptor());
  // Nest's get() throws when the provider is absent, even with strict: false.
  let openApi: OpenApiConfigService | undefined;
  try {
    openApi = app.get(OpenApiConfigService);
  } catch {
    openApi = undefined;
  }
  if (openApi?.enabled) {
    setupOpenApi(app);
  }
}
