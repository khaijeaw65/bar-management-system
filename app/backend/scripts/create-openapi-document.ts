import type { OpenAPIObject } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { buildOpenApiDocument } from '../dist/common/openapi/document.js';
import { AuthController } from '../dist/modules/auth/infrastructure/http/auth.controller.js';
import { AuthService } from '../dist/modules/auth/application/auth.service.js';
import { HealthController } from '../dist/modules/health/health.controller.js';
import { HealthService } from '../dist/modules/health/health.service.js';
import { MenuCatalogService } from '../dist/modules/menu/application/menu-catalog.service.js';
import { MenuWriteService } from '../dist/modules/menu/application/menu-write.service.js';
import { ModifierGroupService } from '../dist/modules/menu/application/modifier-group.service.js';
import { MenuItemWriteController } from '../dist/modules/menu/infrastructure/http/menu-item-write.controller.js';
import { MenuController } from '../dist/modules/menu/infrastructure/http/menu.controller.js';
import { ModifierGroupController } from '../dist/modules/menu/infrastructure/http/modifier-group.controller.js';
import { IdempotencyService } from '../dist/common/idempotency/idempotency.service.js';
import { OrderQueryService } from '../dist/modules/order/application/order-query.service.js';
import { OrderService } from '../dist/modules/order/application/order.service.js';
import { SoldOutService } from '../dist/modules/order/application/sold-out.service.js';
import { TicketService } from '../dist/modules/order/application/ticket.service.js';
import { MenuAvailabilityController } from '../dist/modules/order/infrastructure/http/menu-availability.controller.js';
import { OrdersController } from '../dist/modules/order/infrastructure/http/orders.controller.js';
import { TicketsController } from '../dist/modules/order/infrastructure/http/tickets.controller.js';
import { BillService } from '../dist/modules/payment/application/bill.service.js';
import { PaymentService } from '../dist/modules/payment/application/payment.service.js';
import { PaymentsController } from '../dist/modules/payment/infrastructure/http/payments.controller.js';
import { ReportsService } from '../dist/modules/reports/application/reports.service.js';
import { ReportsController } from '../dist/modules/reports/infrastructure/http/reports.controller.js';
import { TableSeatService } from '../dist/modules/venue/application/table-seat.service.js';
import { VenueSettingsService } from '../dist/modules/venue/application/venue-settings.service.js';
import { VisitService } from '../dist/modules/venue/application/visit.service.js';
import { TablesController } from '../dist/modules/venue/infrastructure/http/tables.controller.js';
import { VenueController } from '../dist/modules/venue/infrastructure/http/venue.controller.js';
import { VisitsController } from '../dist/modules/venue/infrastructure/http/visits.controller.js';
import { AppConfigService } from '../dist/providers/config/app/config.service.js';
import { JwtConfigService } from '../dist/providers/config/jwt/config.service.js';

// ponytail: export boots only the controllers we publish, with providers
// stubbed, so it never connects to Postgres, Redis, or LINE. This file is
// imported only by scripts/openapi-export.ts — not by dist/main.js.
const documentedControllers = [
  HealthController,
  AuthController,
  TablesController,
  VisitsController,
  VenueController,
  MenuController,
  MenuItemWriteController,
  ModifierGroupController,
  OrdersController,
  TicketsController,
  MenuAvailabilityController,
  PaymentsController,
  ReportsController,
];

export async function createOpenApiDocument(): Promise<OpenAPIObject> {
  const moduleRef = await Test.createTestingModule({
    controllers: documentedControllers,
    providers: [
      {
        provide: HealthService,
        useValue: { checkDb: async () => 'up' as const },
      },
      { provide: AuthService, useValue: {} },
      { provide: TableSeatService, useValue: {} },
      { provide: VisitService, useValue: {} },
      { provide: VenueSettingsService, useValue: {} },
      { provide: MenuCatalogService, useValue: {} },
      { provide: MenuWriteService, useValue: {} },
      { provide: ModifierGroupService, useValue: {} },
      { provide: OrderService, useValue: {} },
      { provide: OrderQueryService, useValue: {} },
      { provide: TicketService, useValue: {} },
      { provide: SoldOutService, useValue: {} },
      { provide: IdempotencyService, useValue: {} },
      { provide: BillService, useValue: {} },
      { provide: PaymentService, useValue: {} },
      { provide: ReportsService, useValue: {} },
      {
        provide: AppConfigService,
        useValue: { nodeEnv: 'test', frontendUrl: 'http://localhost:3000' },
      },
      {
        provide: JwtConfigService,
        useValue: { accessTtlSeconds: 900, refreshTtlSeconds: 604_800 },
      },
    ],
  }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  app.setGlobalPrefix('api');
  await app.init();
  try {
    return buildOpenApiDocument(app);
  } finally {
    await app.close();
  }
}
