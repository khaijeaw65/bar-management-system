import {
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  DataSource,
} from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { BaseEntity } from '../../../common/base/base.entity.js';

/**
 * Global TypeORM subscriber.
 * Stamps createdBy / updatedBy from the CLS context so application code
 * never passes the current user manually.
 *
 * Registered once: Nest constructs this provider and the constructor pushes
 * it onto the DataSource. Not listed in TypeORM `subscribers`, and not
 * decorated with `@EventSubscriber()`.
 */
export class AuditSubscriber implements EntitySubscriberInterface {
  public constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly cls: ClsService,
  ) {
    dataSource.subscribers.push(this);
  }

  public listenTo(): typeof BaseEntity {
    return BaseEntity;
  }

  public beforeInsert(event: InsertEvent<BaseEntity>): void {
    const userId: string | undefined = this.cls.get('userId');
    if (userId) {
      event.entity.createdBy = userId;
      event.entity.updatedBy = userId;
    }
  }

  public beforeUpdate(event: UpdateEvent<BaseEntity>): void {
    const userId: string | undefined = this.cls.get('userId');
    if (userId && event.entity) {
      (event.entity as BaseEntity).updatedBy = userId;
    }
  }
}
