import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { COL } from '../constants/sql-column.constant.js';

/**
 * All domain entities extend BaseEntity.
 * createdBy / updatedBy are populated by AuditSubscriber via @nestjs/cls —
 * never set them manually in application code.
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn(COL.UUID)
  public id!: string;

  @Column({ type: COL.UUID, nullable: true, name: 'created_by' })
  public createdBy!: string | null;

  @Column({ type: COL.UUID, nullable: true, name: 'updated_by' })
  public updatedBy!: string | null;

  @CreateDateColumn({ type: COL.TIMESTAMP, name: 'created_at' })
  public createdAt!: Date;

  @UpdateDateColumn({ type: COL.TIMESTAMP, name: 'updated_at' })
  public updatedAt!: Date;
}
