"use client";

import type { TableSummary } from "@bar/contracts";
import { TableCard } from "./TableCard";

export function SeatSection({
  title,
  seats,
  now,
  selectedId,
  onSeat,
}: Readonly<{
  title: string;
  seats: TableSummary[];
  now: number | null;
  selectedId: string | null;
  onSeat: (seat: TableSummary) => void;
}>) {
  if (seats.length === 0) return null;
  const counter = seats[0]?.kind === "counter";

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-subhead text-text-muted">{title}</h2>
      <div
        className={
          counter
            ? "grid grid-cols-[repeat(auto-fill,7.5rem)] gap-3"
            : "grid grid-cols-[repeat(auto-fill,minmax(12.5rem,1fr))] gap-3 pt-1"
        }
      >
        {seats.map((seat) => (
          <TableCard
            key={seat.id}
            seat={seat}
            now={now}
            selected={seat.currentVisit?.id === selectedId}
            onPress={() => onSeat(seat)}
          />
        ))}
      </div>
    </section>
  );
}
