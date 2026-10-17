import type { DataSource } from 'typeorm';
import { newQrToken } from '../modules/venue/application/qr-token.js';
import type { SeededSeatRow, SeedSeat } from './seed-venue.types.js';

const COUNTER_COUNT = 8;
const TABLE_COUNT = 6;

export const VENUE_SEATS: SeedSeat[] = [
  ...numberedSeats('C', 'counter', COUNTER_COUNT),
  ...numberedSeats('T', 'table', TABLE_COUNT),
];

export async function seedVenue(dataSource: DataSource): Promise<void> {
  for (const seat of VENUE_SEATS) {
    await insertSeat(dataSource, seat);
  }
}

function numberedSeats(
  prefix: string,
  kind: SeedSeat['kind'],
  count: number,
): SeedSeat[] {
  return Array.from({ length: count }, (_unused, index) => ({
    label: `${prefix}${index + 1}`,
    kind,
    sortOrder: index + 1,
  }));
}

async function insertSeat(dataSource: DataSource, seat: SeedSeat): Promise<void> {
  const existing = await findSeat(dataSource, seat);
  if (existing?.qr_token) return;
  if (existing) {
    await fillToken(dataSource, existing.id);
    return;
  }
  await dataSource.query(
    `INSERT INTO table_seat (label, kind, sort_order, qr_token)
     VALUES ($1, $2::table_seat_kind, $3, $4)`,
    [seat.label, seat.kind, seat.sortOrder, newQrToken()],
  );
}

async function findSeat(
  dataSource: DataSource,
  seat: SeedSeat,
): Promise<SeededSeatRow | undefined> {
  const rows: SeededSeatRow[] = await dataSource.query(
      `SELECT id, qr_token FROM table_seat WHERE label = $1 AND kind = $2::table_seat_kind`,
      [seat.label, seat.kind],
    );
  return rows[0];
}

async function fillToken(dataSource: DataSource, id: string): Promise<void> {
  await dataSource.query(
    `UPDATE table_seat SET qr_token = $2 WHERE id = $1 AND qr_token IS NULL`,
    [id, newQrToken()],
  );
}
