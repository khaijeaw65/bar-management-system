import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuCatalogService } from './application/menu-catalog.service.js';
import { SystemClock } from './application/system-clock.js';
import { CLOCK } from './domain/clock.js';
import { MENU_CATALOG_REPOSITORY } from './domain/menu-catalog.repository.js';
import { MenuController } from './infrastructure/http/menu.controller.js';
import { menuEntities } from './infrastructure/persistence/menu.entities.js';
import { MenuCatalogTypeormRepository } from './infrastructure/persistence/menu-catalog.typeorm-repository.js';

@Module({
  imports: [TypeOrmModule.forFeature(menuEntities)],
  controllers: [MenuController],
  providers: [
    MenuCatalogTypeormRepository,
    { provide: MENU_CATALOG_REPOSITORY, useExisting: MenuCatalogTypeormRepository },
    { provide: CLOCK, useClass: SystemClock },
    MenuCatalogService,
  ],
  exports: [MenuCatalogService],
})
export class MenuModule {}
