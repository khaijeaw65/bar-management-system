import type { OpenAPIObject } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { buildOpenApiDocument } from '../dist/common/openapi/document.js';
import { HealthController } from '../dist/modules/health/health.controller.js';
import { HealthService } from '../dist/modules/health/health.service.js';

// ponytail: export boots only the controllers we publish, with HealthService
// stubbed, so it never connects to Postgres or Redis. This file is imported
// only by scripts/openapi-export.ts — not by dist/main.js. Add a controller
// here when its brief lands.
const documentedControllers = [HealthController];

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
