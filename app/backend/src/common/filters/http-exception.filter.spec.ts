import {
  ArgumentsHost,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { z } from 'zod';
import { DomainException } from '../domain-exception.js';
import { HttpExceptionFilter } from './http-exception.filter.js';

function host() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return {
    json,
    status,
    argumentsHost: {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ method: 'GET', url: '/api/health' }),
      }),
    } as unknown as ArgumentsHost,
  };
}

describe('HttpExceptionFilter', () => {
  it('maps an HttpException to the error envelope', () => {
    const { json, status, argumentsHost } = host();

    new HttpExceptionFilter().catch(
      new ServiceUnavailableException('database unavailable'),
      argumentsHost,
    );

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith({
      status: 503,
      code: 'INTERNAL_ERROR',
      message: 'database unavailable',
      data: null,
    });
  });

  it('maps a ZodError to VALIDATION_ERROR', () => {
    const { json, status, argumentsHost } = host();
    const parsed = z.object({ name: z.string() }).safeParse({ name: 1 });
    if (parsed.success) {
      throw new Error('expected a Zod failure');
    }
    const failure = parsed.error;

    new HttpExceptionFilter().catch(failure, argumentsHost);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: ['Invalid input: expected string, received number'],
      data: null,
    });
  });

  it('maps DomainException to its code', () => {
    const { json, status, argumentsHost } = host();

    new HttpExceptionFilter().catch(
      new DomainException('CONFLICT', 'state conflict', 409),
      argumentsHost,
    );

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({
      status: 409,
      code: 'CONFLICT',
      message: 'state conflict',
      data: null,
    });
  });

  it('maps NotFoundException to NOT_FOUND', () => {
    const { json, status, argumentsHost } = host();

    new HttpExceptionFilter().catch(new NotFoundException(), argumentsHost);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      status: 404,
      code: 'NOT_FOUND',
      message: 'Not Found',
      data: null,
    });
  });

  it('maps an unknown error to a 500 envelope and logs the stack', () => {
    const errorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const { json, status, argumentsHost } = host();
    const failure = new Error('db blew up');

    new HttpExceptionFilter().catch(failure, argumentsHost);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      data: null,
    });
    expect(errorSpy).toHaveBeenCalledWith(
      'GET /api/health',
      expect.stringContaining('db blew up'),
    );
    errorSpy.mockRestore();
  });
});
