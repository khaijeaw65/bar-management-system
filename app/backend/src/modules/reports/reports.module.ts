import { Module } from '@nestjs/common';
import { CLOCK } from '../../common/clock.js';
import { SystemClock } from '../../common/system-clock.js';
import { ReportsService } from './application/reports.service.js';
import { REPORT_QUERIES } from './domain/ports/report-queries.port.js';
import { ReportsController } from './infrastructure/http/reports.controller.js';
import { ReportsTypeormQueries } from './infrastructure/persistence/reports.typeorm-queries.js';

@Module({
  controllers: [ReportsController],
  providers: [
    { provide: REPORT_QUERIES, useClass: ReportsTypeormQueries },
    { provide: CLOCK, useClass: SystemClock },
    ReportsService,
  ],
})
export class ReportsModule {}
