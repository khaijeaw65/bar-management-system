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
  enableFrontendCors(app);
  enableOpenApi(app);
}

function enableFrontendCors(app: INestApplication): void {
  try {
    const frontendUrl = app.get(AppConfigService).frontendUrl;
    app.enableCors({ origin: frontendUrl, credentials: true });
  } catch {
    // Controller specs boot without app config. The full app always has it.
  }
}

function enableOpenApi(app: INestApplication): void {
  const openApi = findOpenApiConfig(app);
  if (openApi?.enabled) setupOpenApi(app);
}

function findOpenApiConfig(
  app: INestApplication,
): OpenApiConfigService | undefined {
  // Nest's get() throws when the provider is absent, even with strict: false.
  try {
    return app.get(OpenApiConfigService);
  } catch {
    return undefined;
  }
}
