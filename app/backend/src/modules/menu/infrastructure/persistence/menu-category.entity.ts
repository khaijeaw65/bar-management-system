import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../../common/base/base.entity.js';
import { COL } from '../../../../common/constants/sql-column.constant.js';

@Entity('menu_category')
export class MenuCategory extends BaseEntity {
  @Column({ type: COL.VARCHAR, length: 200 })
  public name!: string;

  @Column({ type: COL.SMALLINT, default: 0 })
  public sortOrder!: number;

  @Column({ type: COL.BOOLEAN, default: true })
  public isActive!: boolean;
}
