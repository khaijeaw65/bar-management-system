import { ArgumentsHost, ServiceUnavailableException } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter.js';

describe('HttpExceptionFilter', () => {
  it('maps an HttpException to the error envelope', () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ method: 'GET', url: '/api/health' }),
      }),
    } as unknown as ArgumentsHost;

    new HttpExceptionFilter().catch(
      new ServiceUnavailableException('database unavailable'),
      host,
    );

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith({
      status: 503,
      message: 'database unavailable',
      data: null,
    });
  });
});
