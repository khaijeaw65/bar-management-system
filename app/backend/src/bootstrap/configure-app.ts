import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter.js';
import { TransformResponseInterceptor } from '../common/interceptors/transform-response.interceptor.js';
import { setupOpenApi } from '../common/openapi/setup-openapi.js';
import { RedisIoAdapter } from '../modules/notifications/redis-io.adapter.js';
import { AppConfigService } from '../providers/config/app/config.service.js';
import { OpenApiConfigService } from '../providers/config/openapi/config.service.js';
import { RedisService } from '../providers/redis/redis.service.js';

export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  app.use(cookieParser());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformResponseInterceptor());
  attachSocketAdapter(app);
  enableFrontendCors(app);
  enableOpenApi(app);
}

function attachSocketAdapter(app: INestApplication): void {
  const redis = findRedis(app);
  const frontendUrl = findFrontendUrl(app);
  if (!redis || !frontendUrl) return;
  app.useWebSocketAdapter(
    new RedisIoAdapter(
      app,
      redis.client,
      redis.createSubscriber(),
      frontendUrl,
    ),
  );
}

function findFrontendUrl(app: INestApplication): string | undefined {
  try {
    return app.get(AppConfigService).frontendUrl;
  } catch {
    return undefined;
  }
}

function findRedis(app: INestApplication): RedisService | undefined {
  try {
    return app.get(RedisService);
  } catch {
    return undefined;
  }
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
