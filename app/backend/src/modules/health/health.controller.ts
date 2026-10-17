import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator.js';
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

type HealthStatus = { status: 'ok'; db: 'up' };

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  public constructor(private readonly health: HealthService) {}

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
  public async getHealth(): Promise<HealthStatus> {
    const db = await this.health.checkDb();
    if (db === 'down') {
      throw new ServiceUnavailableException('database unavailable');
    }
    return { status: 'ok' as const, db: 'up' as const };
  }
}
