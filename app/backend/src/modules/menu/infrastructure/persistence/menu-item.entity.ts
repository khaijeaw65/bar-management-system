import type { ItemType, KitchenStation } from '@bar/contracts';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../../common/base/base.entity.js';
import { COL } from '../../../../common/constants/sql-column.constant.js';

@Entity('menu_item')
export class MenuItem extends BaseEntity {
  @Column({ type: COL.UUID })
  public categoryId!: string;

  @Column({ type: COL.VARCHAR, length: 200 })
  public name!: string;

  @Column({ type: COL.TEXT, nullable: true })
  public description!: string | null;

  @Column({ type: COL.VARCHAR, length: 500, nullable: true })
  public imageKey!: string | null;

  @Column({ type: COL.DECIMAL, precision: 10, scale: 2, default: 0 })
  public basePrice!: string;

  @Column({
    type: COL.ENUM,
    enum: ['simple', 'recipe', 'charge'],
    enumName: 'item_type',
    default: 'simple',
  })
  public itemType!: ItemType;

  @Column({
    type: COL.ENUM,
    enum: ['bar', 'food'],
    enumName: 'kitchen_station',
    nullable: true,
  })
  public kitchenTag!: KitchenStation | null;

  @Column({ type: COL.BOOLEAN, default: true })
  public isAvailable!: boolean;

  @Column({ type: COL.BOOLEAN, default: false })
  public isPromo!: boolean;

  @Column({ type: COL.SMALLINT, default: 0 })
  public sortOrder!: number;
}
