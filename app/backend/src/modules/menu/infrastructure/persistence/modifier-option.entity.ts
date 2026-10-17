import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { COL } from '../../../../common/constants/sql-column.constant.js';

/** No created_by / updated_by, so this table does not extend BaseEntity. */
@Entity('modifier_option')
export class ModifierOption {
  @PrimaryGeneratedColumn(COL.UUID)
  public id!: string;

  @Column({ type: COL.UUID })
  public groupId!: string;

  @Column({ type: COL.VARCHAR, length: 200 })
  public name!: string;

  @Column({ type: COL.DECIMAL, precision: 10, scale: 2, default: 0 })
  public priceDelta!: string;

  @Column({ type: COL.BOOLEAN, default: true })
  public isAvailable!: boolean;

  @CreateDateColumn({ type: COL.TIMESTAMP })
  public createdAt!: Date;

  @UpdateDateColumn({ type: COL.TIMESTAMP })
  public updatedAt!: Date;
}
