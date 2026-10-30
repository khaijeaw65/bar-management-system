import { Chip } from "@heroui/react";
import type { CustomerTabTicket } from "@bar/contracts";
import { STATION_LABEL, TICKET_LABEL, visibleTickets } from "../_lib/tab";

export function TicketChips({ tickets }: Readonly<{ tickets: readonly CustomerTabTicket[] }>) {
  const shown = visibleTickets(tickets);
  if (shown.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="สถานะออเดอร์">
      {shown.map((ticket) => (
        <li key={ticket.station}>
          <Chip size="sm" variant="soft" color={ticket.status === "ready" ? "success" : "default"}>
            {STATION_LABEL[ticket.station]} · {TICKET_LABEL[ticket.status as keyof typeof TICKET_LABEL]}
          </Chip>
        </li>
      ))}
    </ul>
  );
}
