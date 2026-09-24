import {
  ArgumentsHost,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
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
      message: 'database unavailable',
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
