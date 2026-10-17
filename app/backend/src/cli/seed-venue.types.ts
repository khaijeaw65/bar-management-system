export interface SeedSeat {
  label: string;
  kind: 'counter' | 'table';
  sortOrder: number;
}

export interface SeededSeatRow {
  id: string;
  qr_token: string | null;
}
