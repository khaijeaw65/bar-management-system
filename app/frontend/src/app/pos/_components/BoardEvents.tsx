"use client";

import { useTicketBoardEvents } from "@/hooks/useTicketBoard";
import { useVenueEvents } from "@/hooks/useVenueEvents";

export function BoardEvents() {
  useTicketBoardEvents();
  useVenueEvents();
  return null;
}
