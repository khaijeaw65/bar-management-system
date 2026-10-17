import { readFileSync } from 'node:fs';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  DocumentBuilder,
  SwaggerModule,
  type OpenAPIObject,
} from '@nestjs/swagger';
import { ApiErrorSchema, apiResponseSchema } from '@bar/contracts';
import { z } from 'zod';
import { HealthController } from '../../modules/health/health.controller.js';
import { HealthService } from '../../modules/health/health.service.js';
import { zodToOpenApi } from './zod-to-openapi.js';

// ponytail: export boots only the controllers we publish, with HealthService
// stubbed, so it never connects to Postgres or Redis. Add a controller here
// when its brief lands.
const documentedControllers = [HealthController];

export function backendVersion(): string {
  const packageJson = new URL('../../../package.json', import.meta.url);
  const pkg = JSON.parse(readFileSync(packageJson, 'utf8')) as {
    version: string;
  };
  return pkg.version;
}

export function openApiConfig(version: string) {
  return new DocumentBuilder()
    .setTitle('The Loft Bar API')
    .setVersion(version)
    .addCookieAuth('access_token')
    .addBearerAuth()
    .addTag('health')
    .build();
}

export function applyContractComponents(document: OpenAPIObject): OpenAPIObject {
  document.components ??= {};
  document.components.schemas ??= {};
  document.components.schemas.ApiError = zodToOpenApi(ApiErrorSchema);
  document.components.schemas.ApiSuccessEnvelope = zodToOpenApi(
    apiResponseSchema(z.unknown()),
  );
  return document;
}

export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  return applyContractComponents(
    SwaggerModule.createDocument(app, openApiConfig(backendVersion())),
  );
}

export async function createOpenApiDocument(): Promise<OpenAPIObject> {
  const moduleRef = await Test.createTestingModule({
    controllers: documentedControllers,
    providers: [
      {
        provide: HealthService,
        useValue: { checkDb: async () => 'up' as const },
      },
    ],
  }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  app.setGlobalPrefix('api');
  await app.init();
  try {
    return buildOpenApiDocument(app);
  } finally {
    await app.close();
  }
}

export function stableJson(value: unknown): string {
  return `${JSON.stringify(sortKeys(value), null, 2)}\n`;
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => key !== '$schema')
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, inner]) => [key, sortKeys(inner)]),
    );
  }
  return value;
}
