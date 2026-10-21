import { VisitDetailSchema, VisitSchema } from "@bar/contracts";
import { apiGet, apiPost } from "./client";

export function getVisit(visitId: string) {
  return apiGet(`/visits/${visitId}`, VisitDetailSchema);
}

export function closeVisit(visitId: string) {
  return apiPost(`/visits/${visitId}/close`, undefined, VisitSchema);
}
