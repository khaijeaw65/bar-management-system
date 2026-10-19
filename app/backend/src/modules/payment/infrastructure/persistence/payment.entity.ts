import type {
  PaymentConfirmedVia,
  PaymentMethod,
  PaymentStatus,
  PaymentStatusReason,
} from '@bar/contracts';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../../common/base/base.entity.js';
import { COL } from '../../../../common/constants/sql-column.constant.js';

@Entity('payment')
export class Payment extends BaseEntity {
  @Column({ type: COL.UUID })
  public visitId!: string;

  @Column({ type: COL.UUID })
  public attemptId!: string;

  @Column({ type: COL.SMALLINT, default: 1 })
  public partNo!: number;

  @Column({ type: COL.SMALLINT, default: 1 })
  public partCount!: number;

  @Column({ type: COL.DECIMAL, precision: 12, scale: 2 })
  public amount!: string;

  @Column({ type: COL.ENUM, enum: ['promptpay', 'cash'], enumName: 'payment_method', default: 'promptpay' })
  public method!: PaymentMethod;

  @Column({
    type: COL.ENUM,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    enumName: 'payment_status',
    default: 'pending',
  })
  public status!: PaymentStatus;

  @Column({
    type: COL.ENUM,
    enum: ['webhook', 'manual', 'cash', 'slip_verify'],
    enumName: 'payment_confirmed_via',
    nullable: true,
  })
  public confirmedVia!: PaymentConfirmedVia | null;

  @Column({ type: COL.VARCHAR, length: 30, nullable: true })
  public statusReason!: PaymentStatusReason | null;

  @Column({ type: COL.TEXT, nullable: true })
  public statusNote!: string | null;

  @Column({ type: COL.TEXT, nullable: true })
  public qrPayload!: string | null;

  @Column({ type: COL.TIMESTAMP, nullable: true })
  public expiresAt!: Date | null;

  @Column({ type: COL.TIMESTAMP, nullable: true })
  public paidAt!: Date | null;
}
