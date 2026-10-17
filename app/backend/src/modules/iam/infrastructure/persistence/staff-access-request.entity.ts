import type { IdentityProvider } from '@bar/contracts';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { COL } from '../../../../common/constants/sql-column.constant.js';

@Entity('staff_access_request')
@Unique(['provider', 'externalId'])
export class StaffAccessRequest {
  @PrimaryGeneratedColumn(COL.UUID)
  public id!: string;

  @Column({
    type: COL.ENUM,
    enum: ['line', 'phone_otp'],
    enumName: 'identity_provider',
  })
  public provider!: IdentityProvider;

  @Column({ type: COL.VARCHAR, length: 300 })
  public externalId!: string;

  @Column({ type: COL.VARCHAR, length: 200, nullable: true })
  public displayName!: string | null;

  @Column({ type: COL.VARCHAR, length: 500, nullable: true })
  public avatarUrl!: string | null;

  @Column({ type: COL.VARCHAR, length: 20, default: 'pending' })
  public status!: string;

  @CreateDateColumn({ type: COL.TIMESTAMP, name: 'requested_at' })
  public requestedAt!: Date;

  @Column({ type: COL.TIMESTAMP, nullable: true })
  public decidedAt!: Date | null;

  @Column({ type: COL.UUID, nullable: true })
  public decidedBy!: string | null;
}
