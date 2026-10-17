import type { OpenAPIObject } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { buildOpenApiDocument } from '../dist/common/openapi/document.js';
import { AuthController } from '../dist/modules/auth/infrastructure/http/auth.controller.js';
import { AuthService } from '../dist/modules/auth/application/auth.service.js';
import { HealthController } from '../dist/modules/health/health.controller.js';
import { HealthService } from '../dist/modules/health/health.service.js';
import { TableSeatService } from '../dist/modules/venue/application/table-seat.service.js';
import { VisitService } from '../dist/modules/venue/application/visit.service.js';
import { TablesController } from '../dist/modules/venue/infrastructure/http/tables.controller.js';
import { VisitsController } from '../dist/modules/venue/infrastructure/http/visits.controller.js';
import { AppConfigService } from '../dist/providers/config/app/config.service.js';
import { JwtConfigService } from '../dist/providers/config/jwt/config.service.js';

// ponytail: export boots only the controllers we publish, with providers
// stubbed, so it never connects to Postgres, Redis, or LINE. This file is
// imported only by scripts/openapi-export.ts — not by dist/main.js.
const documentedControllers = [
  HealthController,
  AuthController,
  TablesController,
  VisitsController,
];

export async function createOpenApiDocument(): Promise<OpenAPIObject> {
  const moduleRef = await Test.createTestingModule({
    controllers: documentedControllers,
    providers: [
      {
        provide: HealthService,
        useValue: { checkDb: async () => 'up' as const },
      },
      { provide: AuthService, useValue: {} },
      { provide: TableSeatService, useValue: {} },
      { provide: VisitService, useValue: {} },
      {
        provide: AppConfigService,
        useValue: { nodeEnv: 'test', frontendUrl: 'http://localhost:3000' },
      },
      {
        provide: JwtConfigService,
        useValue: { accessTtlSeconds: 900, refreshTtlSeconds: 604_800 },
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
