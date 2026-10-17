import type { IdentityProvider } from '@bar/contracts';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { COL } from '../../../../common/constants/sql-column.constant.js';

@Entity('staff_access_request')
@Unique(['provider', 'externalId'])
export class StaffAccessRequest {
  @PrimaryGeneratedColumn(COL.UUID)
  id!: string;

  @Column({
    type: COL.ENUM,
    enum: ['line', 'phone_otp'],
    enumName: 'identity_provider',
  })
  provider!: IdentityProvider;

  @Column({ type: COL.VARCHAR, length: 300 })
  externalId!: string;

  @Column({ type: COL.VARCHAR, length: 200, nullable: true })
  displayName!: string | null;

  @Column({ type: COL.VARCHAR, length: 500, nullable: true })
  avatarUrl!: string | null;

  @Column({ type: COL.VARCHAR, length: 20, default: 'pending' })
  status!: string;

  @CreateDateColumn({ type: COL.TIMESTAMP, name: 'requested_at' })
  requestedAt!: Date;

  @Column({ type: COL.TIMESTAMP, nullable: true })
  decidedAt!: Date | null;

  @Column({ type: COL.UUID, nullable: true })
  decidedBy!: string | null;
}
