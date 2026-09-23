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
  id!: string;

  @Column({ type: COL.UUID, nullable: true, name: 'created_by' })
  createdBy!: string | null;

  @Column({ type: COL.UUID, nullable: true, name: 'updated_by' })
  updatedBy!: string | null;

  @CreateDateColumn({ type: COL.TIMESTAMP, name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: COL.TIMESTAMP, name: 'updated_at' })
  updatedAt!: Date;
}
