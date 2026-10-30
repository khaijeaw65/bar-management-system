import {
  AcknowledgeCallResultSchema,
  OpenVisitResponseSchema,
  TableListSchema,
  type OpenVisitRequest,
} from "@bar/contracts";
import { apiGet, apiPost } from "./client";

export const TABLES_KEY = ["tables"] as const;

export function getTables() {
  return apiGet("/tables", TableListSchema);
}

export function openVisit(body: OpenVisitRequest) {
  return apiPost("/visits", body, OpenVisitResponseSchema);
}

export function acknowledgeCall(seatId: string) {
  return apiPost(`/tables/${seatId}/acknowledge-call`, undefined, AcknowledgeCallResultSchema);
}
