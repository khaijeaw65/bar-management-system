import type { PushPlatform } from '@bar/contracts';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { COL } from '../../../../common/constants/sql-column.constant.js';

/** Device registration data — not an audited entity (DR-003 Amendment 1). */
@Entity('staff_push_token')
export class StaffPushTokenEntity {
  @PrimaryGeneratedColumn(COL.UUID)
  public id!: string;

  @Column({ type: COL.UUID })
  public staffUserId!: string;

  @Column({ type: COL.VARCHAR, length: 255, unique: true })
  public expoPushToken!: string;

  @Column({ type: COL.VARCHAR, length: 10 })
  public platform!: PushPlatform;

  @CreateDateColumn({ type: COL.TIMESTAMP })
  public createdAt!: Date;

  @Column({ type: COL.TIMESTAMP })
  public lastSeenAt!: Date;
}
