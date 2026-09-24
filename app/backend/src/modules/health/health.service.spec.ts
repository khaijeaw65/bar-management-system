import { HealthService } from './health.service.js';

describe('HealthService', () => {
  it('reports down when the database query throws', async () => {
    const dataSource = {
      query: () => Promise.reject(new Error('connection refused')),
    };
    const service = new HealthService(dataSource as never);

    await expect(service.checkDb()).resolves.toBe('down');
  });
});
