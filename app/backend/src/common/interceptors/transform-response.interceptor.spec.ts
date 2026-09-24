import {
  Controller,
  HttpCode,
  Post,
  type CallHandler,
  type ExecutionContext,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { lastValueFrom, of } from 'rxjs';
import request from 'supertest';
import { TransformResponseInterceptor } from './transform-response.interceptor.js';

describe('TransformResponseInterceptor', () => {
  it('wraps the controller value in the success envelope', async () => {
    const interceptor = new TransformResponseInterceptor();
    const context = {
      switchToHttp: () => ({
        getResponse: () => ({ statusCode: 200 }),
      }),
    } as ExecutionContext;
    const next = {
      handle: () => of({ status: 'ok', db: 'up' }),
    } as CallHandler;

    await expect(
      lastValueFrom(interceptor.intercept(context, next)),
    ).resolves.toEqual({
      status: 200,
      message: 'success',
      data: { status: 'ok', db: 'up' },
    });
  });

  it('reads a 201 status from a POST route', async () => {
    @Controller('items')
    class ItemsController {
      @Post()
      @HttpCode(201)
      create() {
        return { id: '1' };
      }
    }

    const moduleRef = await Test.createTestingModule({
      controllers: [ItemsController],
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(new TransformResponseInterceptor());
    await app.init();

    await request(app.getHttpServer())
      .post('/items')
      .expect(201)
      .expect({
        status: 201,
        message: 'success',
        data: { id: '1' },
      });

    await app.close();
  });
});
