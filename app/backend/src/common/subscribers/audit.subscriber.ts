import {
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  DataSource,
} from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { BaseEntity } from '../base/base.entity.js';

/**
 * Global TypeORM subscriber.
 * Stamps createdBy / updatedBy from the CLS (AsyncLocalStorage) context
 * so application code never needs to pass the current user manually.
 *
 * Registered once: Nest constructs this provider and the constructor pushes
 * it onto the DataSource. Not listed in TypeORM `subscribers`, and not
 * decorated with `@EventSubscriber()`, so it is not constructed a second time.
 *
 * TODO: also append to audit_log table once it's defined.
 */
export class AuditSubscriber implements EntitySubscriberInterface {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly cls: ClsService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return BaseEntity;
  }

  beforeInsert(event: InsertEvent<BaseEntity>): void {
    const userId: string | undefined = this.cls.get('userId');
    if (userId) {
      event.entity.createdBy = userId;
      event.entity.updatedBy = userId;
    }
  }

  beforeUpdate(event: UpdateEvent<BaseEntity>): void {
    const userId: string | undefined = this.cls.get('userId');
    if (userId && event.entity) {
      (event.entity as BaseEntity).updatedBy = userId;
    }
  }
}
