import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../../common/base/base.entity.js';
import { COL } from '../../../../common/constants/sql-column.constant.js';

@Entity('menu_item_variant')
export class MenuItemVariant extends BaseEntity {
  @Column({ type: COL.UUID })
  public menuItemId!: string;

  @Column({ type: COL.VARCHAR, length: 200 })
  public name!: string;

  @Column({ type: COL.DECIMAL, precision: 10, scale: 2 })
  public price!: string;

  @Column({ type: COL.BOOLEAN, default: true })
  public isAvailable!: boolean;
}
