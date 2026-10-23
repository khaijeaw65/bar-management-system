import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../../common/base/base.entity.js';
import { COL } from '../../../../common/constants/sql-column.constant.js';

@Entity('order_item')
export class OrderItem extends BaseEntity {
  @Column({ type: COL.UUID })
  public ticketId!: string;

  @Column({ type: COL.UUID })
  public menuItemVariantId!: string;

  @Column({ type: COL.VARCHAR, length: 200 })
  public itemNameSnapshot!: string;

  @Column({ type: COL.VARCHAR, length: 200 })
  public variantNameSnapshot!: string;

  /** Position in the order, 1 … n in the request order. */
  @Column({ type: COL.SMALLINT })
  public lineNo!: number;

  @Column({ type: COL.SMALLINT, default: 1 })
  public quantity!: number;

  @Column({ type: COL.DECIMAL, precision: 10, scale: 2 })
  public unitPriceSnapshot!: string;

  @Column({ type: COL.VARCHAR, length: 100, nullable: true })
  public orderedByName!: string | null;

  @Column({ type: COL.TEXT, nullable: true })
  public notes!: string | null;

  @Column({ type: COL.TIMESTAMP, nullable: true })
  public cancelledAt!: Date | null;

  @Column({ type: COL.UUID, nullable: true })
  public cancelledBy!: string | null;

  @Column({ type: COL.VARCHAR, length: 50, nullable: true })
  public cancelReason!: string | null;

  @Column({ type: COL.TEXT, nullable: true })
  public cancelNote!: string | null;
}
