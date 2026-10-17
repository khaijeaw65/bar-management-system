import type { KitchenStation, OrderStatus } from '@bar/contracts';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../../common/base/base.entity.js';
import { COL } from '../../../../common/constants/sql-column.constant.js';

@Entity('order_ticket')
export class OrderTicket extends BaseEntity {
  @Column({ type: COL.UUID })
  public orderId!: string;

  @Column({
    type: COL.ENUM,
    enum: ['bar', 'food'],
    enumName: 'kitchen_station',
    nullable: true,
  })
  public station!: KitchenStation | null;

  @Column({
    type: COL.ENUM,
    enum: ['pending', 'accepted', 'ready', 'sent', 'issue', 'cancelled'],
    enumName: 'order_status',
    default: 'pending',
  })
  public status!: OrderStatus;

  @Column({ type: COL.VARCHAR, length: 30, nullable: true })
  public issueReason!: string | null;

  @Column({ type: COL.UUID, nullable: true })
  public issueItemId!: string | null;

  @Column({ type: COL.TEXT, nullable: true })
  public issueNote!: string | null;

  @Column({ type: COL.UUID, nullable: true })
  public issueReportedBy!: string | null;

  @Column({ type: COL.TIMESTAMP, nullable: true })
  public issueEscalatedAt!: Date | null;

  @Column({ type: COL.TIMESTAMP, nullable: true })
  public sentAt!: Date | null;
}
