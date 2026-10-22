import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { REPORT_MAX_PERIOD_DAYS, ReportItemsSortSchema } from '@bar/contracts';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';

const businessDate = { type: 'string', format: 'date' } as const;

export function ApiReportPeriod(): MethodDecorator {
  const range = `Business date (venue cut-off, Asia/Bangkok), inclusive; from ≤ to, at most ${REPORT_MAX_PERIOD_DAYS} days.`;
  return applyDecorators(
    ApiQuery({ name: 'from', required: true, schema: businessDate, description: range }),
    ApiQuery({ name: 'to', required: true, schema: businessDate, description: range }),
  );
}

export function ApiReportItemsQuery(): MethodDecorator {
  return applyDecorators(
    ApiReportPeriod(),
    ApiQuery({ name: 'sort', required: true, schema: zodToOpenApi(ReportItemsSortSchema) }),
    ApiQuery({
      name: 'limit',
      required: false,
      schema: { type: 'integer', minimum: 1, maximum: 20, default: 5 },
    }),
  );
}
