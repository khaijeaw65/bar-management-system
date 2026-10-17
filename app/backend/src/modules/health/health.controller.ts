import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { z } from 'zod';
import { ApiEnvelopedOk } from '../../common/openapi/api-enveloped.js';
import { HealthService } from './health.service.js';

const HealthDataSchema = z.object({
  status: z.literal('ok'),
  db: z.literal('up'),
});

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Liveness and database check',
    description: 'Public. No auth cookie or bearer token required.',
  })
  @ApiEnvelopedOk(HealthDataSchema)
  @ApiServiceUnavailableResponse({
    description: 'Database is unreachable',
    schema: { $ref: '#/components/schemas/ApiError' },
  })
  async getHealth() {
    const db = await this.health.checkDb();
    if (db === 'down') {
      throw new ServiceUnavailableException('database unavailable');
    }
    return { status: 'ok' as const, db: 'up' as const };
  }
}
