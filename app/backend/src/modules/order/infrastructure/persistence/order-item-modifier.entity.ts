import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { COL } from '../../../../common/constants/sql-column.constant.js';

/** No audit columns, so this table does not extend BaseEntity. */
@Entity('order_item_modifier')
export class OrderItemModifier {
  @PrimaryGeneratedColumn(COL.UUID)
  public id!: string;

  @Column({ type: COL.UUID })
  public orderItemId!: string;

  @Column({ type: COL.UUID })
  public modifierOptionId!: string;

  @Column({ type: COL.VARCHAR, length: 200 })
  public optionNameSnapshot!: string;

  @Column({ type: COL.DECIMAL, precision: 10, scale: 2 })
  public priceDeltaSnapshot!: string;
}
