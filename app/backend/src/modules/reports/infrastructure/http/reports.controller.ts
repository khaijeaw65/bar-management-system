import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ReportDailySchema,
  ReportItemsQuerySchema,
  ReportItemsSchema,
  ReportSummarySchema,
  ReportTodaySchema,
  ReportsPeriodQuerySchema,
  type ReportDaily,
  type ReportItems,
  type ReportSummary,
  type ReportToday,
} from '@bar/contracts';
import { RequirePermissions } from '../../../../common/decorators/require-permissions.decorator.js';
import { staffAccess } from '../../../../common/http/http-input.js';
import { ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { ReportsService } from '../../application/reports.service.js';
import { ApiReportItemsQuery, ApiReportPeriod } from './reports.openapi.js';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  public constructor(private readonly reports: ReportsService) {}

  @Get('summary')
  @RequirePermissions('reports:read')
  @ApiOperation({
    summary: 'Revenue, bills, average bill, payment split and the previous equal period',
    description: staffAccess('reports:read'),
  })
  @ApiReportPeriod()
  @ApiEnvelopedOk(ReportSummarySchema)
  public summary(@Query() query: unknown): Promise<ReportSummary> {
    return this.reports.summary(ReportsPeriodQuerySchema.parse(query));
  }

  @Get('daily')
  @RequirePermissions('reports:read')
  @ApiOperation({
    summary: 'Revenue and bills per business day, every date in range',
    description: staffAccess('reports:read'),
  })
  @ApiReportPeriod()
  @ApiEnvelopedOk(ReportDailySchema)
  public daily(@Query() query: unknown): Promise<ReportDaily> {
    return this.reports.daily(ReportsPeriodQuerySchema.parse(query));
  }

  @Get('items')
  @RequirePermissions('reports:read')
  @ApiOperation({
    summary: 'Best (by revenue) or worst (by quantity) sellers; charge items excluded',
    description: `${staffAccess('reports:read')} bottom skips unavailable items and items added in the last 7 days.`,
  })
  @ApiReportItemsQuery()
  @ApiEnvelopedOk(ReportItemsSchema)
  public items(@Query() query: unknown): Promise<ReportItems> {
    return this.reports.items(ReportItemsQuerySchema.parse(query));
  }

  @Get('today')
  @RequirePermissions('reports:read')
  @ApiOperation({
    summary: 'Tonight: revenue, closed bills, hourly revenue, open seats, ticket counts',
    description: staffAccess('reports:read'),
  })
  @ApiEnvelopedOk(ReportTodaySchema)
  public today(): Promise<ReportToday> {
    return this.reports.today();
  }
}
