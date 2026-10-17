import {
  Body,
  Controller,
  Get,
  Module,
  Post,
  type INestApplication,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { z } from 'zod';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { DomainException } from '../src/common/domain-exception.js';
import { OpenApiConfigModule } from '../src/providers/config/openapi/config.module.js';

const NameSchema = z.object({ name: z.string() });

@Controller('probe')
class ProbeController {
  @Post('zod')
  zod(@Body() body: unknown) {
    return NameSchema.parse(body);
  }

  @Get('conflict')
  conflict() {
    throw new DomainException('CONFLICT', 'state conflict', 409);
  }

  @Get('boom')
  boom() {
    throw new Error('boom');
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
    OpenApiConfigModule,
  ],
  controllers: [ProbeController],
})
class EnvelopeE2eModule {}

describe('Error envelope (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    vi.stubEnv('OPENAPI_ENABLED', 'false');
    const moduleRef = await Test.createTestingModule({
      imports: [EnvelopeE2eModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    vi.unstubAllEnvs();
  });

  it('maps a Zod failure to VALIDATION_ERROR', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/probe/zod')
      .send({ name: 1 })
      .expect(400);
    expect(response.body).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      data: null,
    });
    expect(response.body.message).toEqual(expect.any(Array));
    expect(response.body.message.length).toBeGreaterThan(0);
  });

  it('maps an unknown route to NOT_FOUND', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/missing')
      .expect(404);
    expect(response.body).toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
      data: null,
    });
  });

  it('maps DomainException to its code', async () => {
    await request(app.getHttpServer())
      .get('/api/probe/conflict')
      .expect(409)
      .expect({
        status: 409,
        code: 'CONFLICT',
        message: 'state conflict',
        data: null,
      });
  });

  it('maps an unexpected error to INTERNAL_ERROR', async () => {
    await request(app.getHttpServer())
      .get('/api/probe/boom')
      .expect(500)
      .expect({
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        data: null,
      });
  });
});
