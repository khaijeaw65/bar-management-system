import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from './health.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  async getHealth() {
    const db = await this.health.checkDb();
    if (db === 'down') {
      throw new ServiceUnavailableException('database unavailable');
    }
    return { status: 'ok' as const, db: 'up' as const };
  }
}
