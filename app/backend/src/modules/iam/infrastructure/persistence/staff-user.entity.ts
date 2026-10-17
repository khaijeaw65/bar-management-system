import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { COL } from '../../../../common/constants/sql-column.constant.js';

/** staff_user has timestamps but no created_by / updated_by, so it does not extend BaseEntity. */
@Entity('staff_user')
export class StaffUser {
  @PrimaryGeneratedColumn(COL.UUID)
  public id!: string;

  @Column({ type: COL.VARCHAR, length: 200 })
  public displayName!: string;

  @Column({ type: COL.BOOLEAN, default: true })
  public isActive!: boolean;

  @Column({ type: COL.VARCHAR, length: 100, nullable: true })
  public posPinHash!: string | null;

  @CreateDateColumn({ type: COL.TIMESTAMP })
  public createdAt!: Date;

  @UpdateDateColumn({ type: COL.TIMESTAMP })
  public updatedAt!: Date;
}
