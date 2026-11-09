import type { NotificationType } from '@bar/contracts';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { COL } from '../../../../common/constants/sql-column.constant.js';

@Entity('notification')
export class NotificationEntity {
  @PrimaryGeneratedColumn(COL.UUID)
  public id!: string;

  @Column({ type: COL.UUID })
  public recipientId!: string;

  @Column({
    type: COL.ENUM,
    enum: [
      'table_idle',
      'table_opened',
      'restock_request',
      'low_stock',
      'payment_confirmed',
      'order_new',
      'food_ready',
      'call_staff',
    ],
    enumName: 'notification_type',
  })
  public type!: NotificationType;

  @Column({ type: COL.VARCHAR, length: 200 })
  public title!: string;

  @Column({ type: COL.VARCHAR, length: 500, nullable: true })
  public body!: string | null;

  @Column({ type: COL.VARCHAR, length: 50, nullable: true })
  public refType!: string | null;

  @Column({ type: COL.UUID, nullable: true })
  public refId!: string | null;

  @Column({ type: COL.TIMESTAMP, nullable: true })
  public readAt!: Date | null;

  @CreateDateColumn({ type: COL.TIMESTAMP })
  public createdAt!: Date;
}
