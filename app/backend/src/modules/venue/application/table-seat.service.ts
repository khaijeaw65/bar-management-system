import { Inject, Injectable } from '@nestjs/common';
import type { TableSummary } from '@bar/contracts';
import { DomainException } from '../../../common/domain-exception.js';
import {
  TABLE_SEAT_REPOSITORY,
  type TableSeatRepository,
} from '../domain/table-seat.repository.js';
import { newQrToken } from './qr-token.js';
import { toTableSummary } from './table-summary.js';

@Injectable()
export class TableSeatService {
  public constructor(
    @Inject(TABLE_SEAT_REPOSITORY)
    private readonly tableSeatRepository: TableSeatRepository,
  ) {}

  public async list(): Promise<TableSummary[]> {
    const active = await this.tableSeatRepository.listActive();
    return active.map(toTableSummary);
  }

  public async regenerateQr(id: string): Promise<string> {
    const seat = await this.tableSeatRepository.findActiveById(id);
    if (!seat) throw new DomainException('NOT_FOUND', 'ไม่พบโต๊ะ', 404);
    const qrToken = newQrToken();
    await this.tableSeatRepository.replaceQrToken(seat.id, qrToken);
    return qrToken;
  }
}
