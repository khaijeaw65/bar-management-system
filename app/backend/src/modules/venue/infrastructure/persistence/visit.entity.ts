import type { VisitOpenSource, VisitState } from '@bar/contracts';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { COL } from '../../../../common/constants/sql-column.constant.js';

@Entity('visit')
@Index('uq_visit_live_per_seat', ['tableSeatId'], {
  unique: true,
  where: "state IN ('open', 'active', 'idle')",
})
export class Visit {
  @PrimaryGeneratedColumn(COL.UUID)
  public id!: string;

  @Column({ type: COL.UUID })
  public tableSeatId!: string;

  // Nullable until the customer table exists. No FK in this migration.
  @Column({ type: COL.UUID, nullable: true })
  public customerId!: string | null;

  @Column({
    type: COL.ENUM,
    enum: ['open', 'active', 'idle', 'closed', 'abandoned'],
    enumName: 'visit_state',
    default: 'open',
  })
  public state!: VisitState;

  @Column({ type: COL.VARCHAR, length: 100, nullable: true })
  public guestLabel!: string | null;

  @Column({ type: COL.UUID, nullable: true })
  public openedBy!: string | null;

  @Column({
    type: COL.ENUM,
    enum: ['pos', 'app', 'qr'],
    enumName: 'visit_open_source',
    default: 'pos',
  })
  public openedVia!: VisitOpenSource;

  @Column({ type: COL.TIMESTAMP })
  public openedAt!: Date;

  @Column({ type: COL.TIMESTAMP, nullable: true })
  public closedAt!: Date | null;

  @CreateDateColumn({ type: COL.TIMESTAMP })
  public createdAt!: Date;

  @UpdateDateColumn({ type: COL.TIMESTAMP })
  public updatedAt!: Date;
}
