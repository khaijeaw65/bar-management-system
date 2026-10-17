import { Module, type INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { MoneySchema } from '@bar/contracts';
import request from 'supertest';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { HealthController } from '../src/modules/health/health.controller.js';
import { HealthService } from '../src/modules/health/health.service.js';
import { OpenApiConfigModule } from '../src/providers/config/openapi/config.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
    OpenApiConfigModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: HealthService,
      useValue: { checkDb: async () => 'up' as const },
    },
  ],
})
class OpenApiE2eModule {}

async function boot(enabled: 'true' | 'false'): Promise<INestApplication> {
  vi.stubEnv('OPENAPI_ENABLED', enabled);
  const moduleRef = await Test.createTestingModule({
    imports: [OpenApiE2eModule],
  }).compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}

describe('OpenAPI', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads MoneySchema at runtime', () => {
    expect(MoneySchema.parse('120.00')).toBe('120.00');
  });

  describe('OPENAPI_ENABLED=true', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await boot('true');
    });

    afterAll(async () => {
      await app.close();
    });

    it('serves Swagger UI at /api/docs', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs')
        .expect(200);
      expect(response.text.toLowerCase()).toContain('swagger');
    });

    it('serves an OpenAPI 3.0 document for /api/health', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);
      const health = response.body.paths?.['/api/health']?.get;
      const okSchema =
        health?.responses?.['200']?.content?.['application/json']?.schema;
      expect(String(response.body.openapi)).toMatch(/^3\.0\./);
      expect(okSchema?.properties?.code).toBeDefined();
      expect(okSchema?.properties?.data?.properties?.db).toBeDefined();
      expect(response.body.components?.schemas?.ApiError).toBeDefined();
    });
  });

  describe('OPENAPI_ENABLED=false', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await boot('false');
    });

    afterAll(async () => {
      await app.close();
    });

    it.each(['/api/docs', '/api/docs-json'])('%s is 404', async (path) => {
      await request(app.getHttpServer()).get(path).expect(404);
    });
  });
});
