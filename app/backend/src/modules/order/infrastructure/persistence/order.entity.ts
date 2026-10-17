import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../../common/base/base.entity.js';
import { COL } from '../../../../common/constants/sql-column.constant.js';

@Entity('order_record')
export class OrderRecord extends BaseEntity {
  @Column({ type: COL.UUID })
  public visitId!: string;

  @Column({ type: COL.INT })
  public orderNumber!: number;

  @Column({ type: COL.DATE })
  public businessDate!: string;
}
