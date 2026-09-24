import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
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
});
