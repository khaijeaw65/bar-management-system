import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configureApp } from '../../bootstrap/configure-app.js';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

describe('HealthController', () => {
  it('returns 503 when the database is down', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: { checkDb: () => Promise.resolve('down') },
        },
      ],
    }).compile();

    const app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    await request(app.getHttpServer()).get('/api/health').expect(503).expect({
      status: 503,
      message: 'database unavailable',
      data: null,
    });

    await app.close();
  });
});
