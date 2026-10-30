"use client";

import { usePosAlerts } from "@/hooks/usePosAlerts";
import { useTicketBoardEvents } from "@/hooks/useTicketBoard";
import { useVenueEvents } from "@/hooks/useVenueEvents";

export function BoardEvents() {
  useTicketBoardEvents();
  useVenueEvents();
  usePosAlerts();
  return null;
}
