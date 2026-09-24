import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { HealthService } from './health.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  async getHealth(@Res({ passthrough: true }) res: Response) {
    const db = await this.health.checkDb();
    if (db === 'down') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
      return { status: 'error' as const, db: 'down' as const };
    }
    return { status: 'ok' as const, db: 'up' as const };
  }
}
