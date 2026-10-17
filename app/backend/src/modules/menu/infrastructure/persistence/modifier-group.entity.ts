import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../../common/base/base.entity.js';
import { COL } from '../../../../common/constants/sql-column.constant.js';

@Entity('modifier_group')
export class ModifierGroup extends BaseEntity {
  @Column({ type: COL.VARCHAR, length: 200 })
  public name!: string;

  @Column({ type: COL.BOOLEAN, default: false })
  public isRequired!: boolean;

  @Column({ type: COL.SMALLINT, default: 0 })
  public minSelect!: number;

  @Column({ type: COL.SMALLINT, default: 1 })
  public maxSelect!: number;
}
