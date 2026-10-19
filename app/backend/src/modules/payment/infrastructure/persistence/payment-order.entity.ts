import { Entity, PrimaryColumn } from 'typeorm';
import { COL } from '../../../../common/constants/sql-column.constant.js';

@Entity('payment_order')
export class PaymentOrderLink {
  @PrimaryColumn({ type: COL.UUID })
  public paymentId!: string;

  @PrimaryColumn({ type: COL.UUID })
  public orderId!: string;
}
