import type { IdentityProvider } from '@bar/contracts';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { COL } from '../../../../common/constants/sql-column.constant.js';

@Entity('staff_user_identity')
@Unique(['provider', 'externalId'])
export class StaffUserIdentity {
  @PrimaryGeneratedColumn(COL.UUID)
  id!: string;

  @Column({ type: COL.UUID })
  userId!: string;

  @Column({
    type: COL.ENUM,
    enum: ['line', 'phone_otp'],
    enumName: 'identity_provider',
  })
  provider!: IdentityProvider;

  @Column({ type: COL.VARCHAR, length: 300, nullable: true })
  externalId!: string | null;

  @Column({ type: COL.VARCHAR, length: 200, nullable: true })
  displayName!: string | null;

  @Column({ type: COL.VARCHAR, length: 500, nullable: true })
  avatarUrl!: string | null;

  @CreateDateColumn({ type: COL.TIMESTAMP })
  createdAt!: Date;
}
