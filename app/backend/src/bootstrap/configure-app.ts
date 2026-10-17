import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter.js';
import { TransformResponseInterceptor } from '../common/interceptors/transform-response.interceptor.js';
import { setupOpenApi } from '../common/openapi/setup-openapi.js';
import { AppConfigService } from '../providers/config/app/config.service.js';
import { OpenApiConfigService } from '../providers/config/openapi/config.service.js';

export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  app.use(cookieParser());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformResponseInterceptor());
  try {
    const frontendUrl = app.get(AppConfigService).frontendUrl;
    app.enableCors({ origin: frontendUrl, credentials: true });
  } catch {
    // Controller specs boot without app config. The full app always has it.
  }
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
