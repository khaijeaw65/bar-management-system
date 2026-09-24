import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { AuditSubscriber } from '../src/common/subscribers/audit.subscriber.js';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    await app.get(DataSource).runMigrations();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health reports the database is up', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok', db: 'up' });
  });

  it('registers AuditSubscriber once', () => {
    const matches = app
      .get(DataSource)
      .subscribers.filter(
        (subscriber) => subscriber instanceof AuditSubscriber,
      );
    expect(matches).toHaveLength(1);
  });
});
