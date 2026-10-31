import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  NotificationRepository,
  type NewNotificationRow,
  type NotificationRecord,
} from '../../domain/ports/notification.repository.port.js';
import { NotificationEntity } from './notification.entity.js';

@Injectable()
export class NotificationTypeOrmRepository implements NotificationRepository {
  public constructor(
    @InjectRepository(NotificationEntity)
    private readonly repo: Repository<NotificationEntity>,
  ) {}

  public async insertMany(rows: NewNotificationRow[]): Promise<NotificationRecord[]> {
    const entities = rows.map((row) => this.repo.create(row));
    return await this.repo.save(entities);
  }

  public async findPage(
    recipientId: string,
    cursorId: string | null,
    limit: number,
  ): Promise<NotificationRecord[]> {
    const qb = this.repo
      .createQueryBuilder('n')
      .where('n.recipient_id = :recipientId', { recipientId });
    if (cursorId) {
      qb.andWhere(
        '(n.created_at, n.id) < (SELECT sub.created_at, sub.id FROM notification sub WHERE sub.id = :cursorId)',
        { cursorId },
      );
    }
    return await qb
      .orderBy('n.created_at', 'DESC')
      .addOrderBy('n.id', 'DESC')
      .take(limit)
      .getMany();
  }

  public async countUnread(recipientId: string): Promise<number> {
    return await this.repo.count({
      where: {
        recipientId,
        readAt: IsNull(),
      },
    });
  }

  public async findByIdAndRecipient(
    id: string,
    recipientId: string,
  ): Promise<NotificationRecord | null> {
    return await this.repo.findOne({
      where: { id, recipientId },
    });
  }

  public async markRead(item: NotificationRecord, readAt: Date): Promise<NotificationRecord> {
    item.readAt = readAt;
    return await this.repo.save(item);
  }

  public async markAllRead(recipientId: string, readAt: Date): Promise<number> {
    const res = await this.repo
      .createQueryBuilder()
      .update(NotificationEntity)
      .set({ readAt })
      .where('recipient_id = :recipientId AND read_at IS NULL', { recipientId })
      .execute();
    return res.affected ?? 0;
  }
}
