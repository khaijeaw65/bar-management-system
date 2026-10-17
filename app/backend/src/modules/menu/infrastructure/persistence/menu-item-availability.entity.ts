import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../../common/base/base.entity.js';
import { COL } from '../../../../common/constants/sql-column.constant.js';

@Entity('menu_item_availability')
@Index('idx_menu_item_avail_item', ['menuItemId'])
export class MenuItemAvailability extends BaseEntity {
  @Column({ type: COL.UUID })
  public menuItemId!: string;

  @Column({ type: COL.SMALLINT, array: true })
  public daysOfWeek!: number[];

  @Column({ type: COL.TIME })
  public startTime!: string;

  @Column({ type: COL.TIME })
  public endTime!: string;
}
