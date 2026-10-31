import type { OpenAPIObject } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { buildOpenApiDocument } from '../dist/common/openapi/document.js';
import { AuthController } from '../dist/modules/auth/infrastructure/http/auth.controller.js';
import { AuthService } from '../dist/modules/auth/application/auth.service.js';
import { CustomerCallService } from '../dist/modules/customer/application/customer-call.service.js';
import { CustomerOrderService } from '../dist/modules/customer/application/customer-order.service.js';
import { CustomerTabService } from '../dist/modules/customer/application/customer-tab.service.js';
import { CustomerPaymentService } from '../dist/modules/customer/application/customer-payment.service.js';
import { CustomerTabGateway } from '../dist/modules/customer/application/customer-tab-gateway.js';
import { CustomerMenuService } from '../dist/modules/customer/application/customer-menu.service.js';
import { GuestSessionService } from '../dist/modules/customer/application/guest-session.service.js';
import { CustomerOrderController } from '../dist/modules/customer/infrastructure/http/customer-order.controller.js';
import { CustomerPaymentController } from '../dist/modules/customer/infrastructure/http/customer-payment.controller.js';
import { CustomerMenuController } from '../dist/modules/customer/infrastructure/http/customer-menu.controller.js';
import {
  CustomerScanController,
  CustomerSessionController,
} from '../dist/modules/customer/infrastructure/http/customer-session.controller.js';
import { IamAdminService } from '../dist/modules/iam/application/iam-admin.service.js';
import { StaffAdminService } from '../dist/modules/iam/application/staff-admin.service.js';
import {
  AccessRequestsController,
  StaffController,
} from '../dist/modules/iam/infrastructure/http/staff.controller.js';
import {
  PermissionCatalogController,
  PoliciesController,
  StaffGroupsController,
} from '../dist/modules/iam/infrastructure/http/iam-admin.controller.js';
import { MeController } from '../dist/modules/iam/infrastructure/http/me.controller.js';
import { PermissionResolver } from '../dist/modules/iam/application/permission-resolver.service.js';
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
import { NotificationsController } from '../dist/modules/notifications/infrastructure/http/notifications.controller.js';
import { NotificationsService } from '../dist/modules/notifications/notifications.service.js';

// ponytail: export boots only the controllers we publish, with providers
// stubbed, so it never connects to Postgres, Redis, or LINE. This file is
// imported only by scripts/openapi-export.ts — not by dist/main.js.
const documentedControllers = [
  HealthController,
  AuthController,
  MeController,
  AccessRequestsController,
  StaffController,
  PermissionCatalogController,
  StaffGroupsController,
  PoliciesController,
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
  NotificationsController,
  CustomerScanController,
  CustomerSessionController,
  CustomerMenuController,
  CustomerOrderController,
  CustomerPaymentController,
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
      { provide: PermissionResolver, useValue: {} },
      { provide: StaffAdminService, useValue: {} },
      { provide: IamAdminService, useValue: {} },
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
      { provide: GuestSessionService, useValue: {} },
      { provide: CustomerTabGateway, useValue: {} },
      { provide: CustomerMenuService, useValue: {} },
      { provide: CustomerPaymentService, useValue: {} },
      { provide: CustomerOrderService, useValue: {} },
      { provide: CustomerTabService, useValue: {} },
      { provide: CustomerCallService, useValue: {} },
      { provide: NotificationsService, useValue: {} },
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
