import { OpenVisitResponseSchema, TableListSchema, type OpenVisitRequest } from "@bar/contracts";
import { apiGet, apiPost } from "./client";

export function getTables() {
  return apiGet("/tables", TableListSchema);
}

export function openVisit(body: OpenVisitRequest) {
  return apiPost("/visits", body, OpenVisitResponseSchema);
}
