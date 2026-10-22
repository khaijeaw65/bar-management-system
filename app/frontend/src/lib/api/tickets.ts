import { TicketListSchema, TicketSchema, type ResolveIssueRequest } from "@bar/contracts";
import { apiGet, apiPost } from "./client";

export type TicketTransition = "accept" | "ready" | "send";

export function getBoardTickets() {
  return apiGet("/tickets?status=pending,accepted,ready,issue", TicketListSchema);
}

export function transitionTicket(id: string, transition: TicketTransition) {
  return apiPost(`/tickets/${id}/${transition}`, undefined, TicketSchema);
}

export function resolveTicket(id: string, body: ResolveIssueRequest) {
  return apiPost(`/tickets/${id}/resolve`, body, TicketSchema);
}
