import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clock } from '../../common/clock.js';
import { SystemClock } from '../../common/system-clock.js';
import { IdempotencyService } from '../../common/idempotency/idempotency.service.js';
import { StorageModule } from '../../common/storage/storage.module.js';
import { RedisModule } from '../../providers/redis/redis.module.js';
import { MenuCatalogService } from './application/menu-catalog.service.js';
import { MenuPhotoService } from './application/menu-photo.service.js';
import { MenuWriteService } from './application/menu-write.service.js';
import { ModifierGroupService } from './application/modifier-group.service.js';
import { MenuCatalogRepository } from './domain/menu-catalog.repository.js';
import { MenuWriteRepository } from './domain/menu-write.repository.js';
import { ModifierGroupRepository } from './domain/modifier-group.repository.js';
import { MenuItemWriteController } from './infrastructure/http/menu-item-write.controller.js';
import { MenuController } from './infrastructure/http/menu.controller.js';
import { ModifierGroupController } from './infrastructure/http/modifier-group.controller.js';
import { menuEntities } from './infrastructure/persistence/menu.entities.js';
import { MenuCatalogTypeormRepository } from './infrastructure/persistence/menu-catalog.typeorm-repository.js';
import { MenuWriteTypeormRepository } from './infrastructure/persistence/menu-write.typeorm-repository.js';
import { ModifierGroupTypeormRepository } from './infrastructure/persistence/modifier-group.typeorm-repository.js';

@Module({
  imports: [TypeOrmModule.forFeature(menuEntities), RedisModule, StorageModule],
  controllers: [MenuController, MenuItemWriteController, ModifierGroupController],
  providers: [
    MenuCatalogTypeormRepository,
    { provide: MenuCatalogRepository, useExisting: MenuCatalogTypeormRepository },
    MenuWriteTypeormRepository,
    { provide: MenuWriteRepository, useExisting: MenuWriteTypeormRepository },
    ModifierGroupTypeormRepository,
    { provide: ModifierGroupRepository, useExisting: ModifierGroupTypeormRepository },
    { provide: Clock, useClass: SystemClock },
    IdempotencyService,
    MenuCatalogService,
    MenuPhotoService,
    MenuWriteService,
    ModifierGroupService,
  ],
  exports: [MenuCatalogService],
})
export class MenuModule {}
