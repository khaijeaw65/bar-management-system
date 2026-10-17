import { Entity, PrimaryColumn } from 'typeorm';
import { COL } from '../../../../common/constants/sql-column.constant.js';

/** Join table. No audit columns, so it does not extend BaseEntity. */
@Entity('menu_variant_modifier_group')
export class MenuVariantModifierGroup {
  @PrimaryColumn({ type: COL.UUID })
  public menuItemVariantId!: string;

  @PrimaryColumn({ type: COL.UUID })
  public modifierGroupId!: string;
}
