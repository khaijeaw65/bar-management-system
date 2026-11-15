import { Module } from '@nestjs/common';
import { Clock } from '../../common/clock.js';
import { SystemClock } from '../../common/system-clock.js';
import { ReportsService } from './application/reports.service.js';
import { ReportQueries } from './domain/ports/report-queries.port.js';
import { ReportsController } from './infrastructure/http/reports.controller.js';
import { ReportsTypeormQueries } from './infrastructure/persistence/reports.typeorm-queries.js';

@Module({
  controllers: [ReportsController],
  providers: [
    { provide: ReportQueries, useClass: ReportsTypeormQueries },
    { provide: Clock, useClass: SystemClock },
    ReportsService,
  ],
})
export class ReportsModule {}
