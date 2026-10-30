import type { TableSeatKind } from '@bar/contracts';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../../common/base/base.entity.js';
import { COL } from '../../../../common/constants/sql-column.constant.js';

@Entity('table_seat')
export class TableSeat extends BaseEntity {
  @Column({ type: COL.VARCHAR, length: 50 })
  public label!: string;

  @Index()
  @Column({
    type: COL.ENUM,
    enum: ['table', 'counter'],
    enumName: 'table_seat_kind',
    default: 'table',
  })
  public kind!: TableSeatKind;

  @Column({ type: COL.SMALLINT, default: 0 })
  public sortOrder!: number;

  @Column({ type: COL.VARCHAR, length: 64, unique: true, nullable: true })
  public qrToken!: string | null;

  @Column({ type: COL.BOOLEAN, default: true })
  public isActive!: boolean;

  @Column({ type: COL.TIMESTAMP, nullable: true })
  public staffCalledAt!: Date | null;

  @Column({ type: COL.VARCHAR, length: 10, nullable: true })
  public staffCallReason!: 'bill' | 'other' | null;

  @Column({ type: COL.VARCHAR, length: 100, nullable: true })
  public staffCallNote!: string | null;
}
