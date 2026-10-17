import type { PromptpayIdType, VenuePaymentMode } from '@bar/contracts';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../../common/base/base.entity.js';
import { COL } from '../../../../common/constants/sql-column.constant.js';

@Entity('venue')
export class Venue extends BaseEntity {
  @Column({ type: COL.VARCHAR, length: 200 })
  public name!: string;

  @Column({ type: COL.VARCHAR, length: 100, unique: true })
  public slug!: string;

  @Column({ type: COL.BOOLEAN, default: false })
  public kitchenDisplayEnabled!: boolean;

  @Column({ type: COL.TIME, default: '06:00:00' })
  public businessDayCutoff!: string;

  @Column({
    type: COL.ENUM,
    enum: ['own_promptpay', 'gateway'],
    enumName: 'venue_payment_mode',
    default: 'own_promptpay',
  })
  public paymentMode!: VenuePaymentMode;

  @Column({ type: COL.VARCHAR, length: 20, nullable: true })
  public promptpayId!: string | null;

  @Column({
    type: COL.ENUM,
    enum: ['mobile', 'national_id', 'ewallet'],
    enumName: 'promptpay_id_type',
    nullable: true,
  })
  public promptpayIdType!: PromptpayIdType | null;

  @Column({ type: COL.BOOLEAN, default: false })
  public counterQrEnabled!: boolean;

  @Column({ type: COL.BOOLEAN, default: false })
  public shiftCloseEnabled!: boolean;
}
