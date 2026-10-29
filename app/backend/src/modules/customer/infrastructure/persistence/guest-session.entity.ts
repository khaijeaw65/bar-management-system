import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { COL } from '../../../../common/constants/sql-column.constant.js';

@Entity('guest_session')
export class GuestSession {
  @PrimaryGeneratedColumn(COL.UUID)
  public id!: string;

  @Column({ type: 'char', length: 64, unique: true })
  public tokenHash!: string;

  @Index()
  @Column({ type: COL.UUID })
  public tableSeatId!: string;

  @Column({ type: COL.UUID, nullable: true })
  public visitId!: string | null;

  @Column({ type: COL.VARCHAR, length: 30, nullable: true })
  public displayName!: string | null;

  @Column({ type: COL.TIMESTAMP })
  public expiresAt!: Date;

  @CreateDateColumn({ type: COL.TIMESTAMP })
  public createdAt!: Date;

  @UpdateDateColumn({ type: COL.TIMESTAMP })
  public updatedAt!: Date;
}
