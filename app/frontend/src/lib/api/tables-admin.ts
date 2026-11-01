import {
  CreateSeatRequestSchema,
  RegenerateQrResponseSchema,
  ReorderSeatsRequestSchema,
  SeatAdminListSchema,
  SeatAdminSchema,
  UpdateSeatRequestSchema,
  type CreateSeatRequest,
  type RegenerateQrResponse,
  type ReorderSeatsRequest,
  type SeatAdmin,
  type SeatAdminList,
  type UpdateSeatRequest,
} from "@bar/contracts";
import { apiGet, apiPatch, apiPost, apiPut } from "./client";

export const SEATS_ADMIN_KEY = ["tables", "manage"] as const;

export function getSeatsAdmin(): Promise<SeatAdminList> {
  return apiGet("/tables/manage", SeatAdminListSchema);
}

export function createSeat(body: CreateSeatRequest): Promise<SeatAdmin> {
  return apiPost("/tables", CreateSeatRequestSchema.parse(body), SeatAdminSchema);
}

export function updateSeat(id: string, body: UpdateSeatRequest): Promise<SeatAdmin> {
  return apiPatch(`/tables/${id}`, UpdateSeatRequestSchema.parse(body), SeatAdminSchema);
}

export function reorderSeats(body: ReorderSeatsRequest): Promise<SeatAdminList> {
  return apiPut("/tables/order", ReorderSeatsRequestSchema.parse(body), SeatAdminListSchema);
}

export function deactivateSeat(id: string): Promise<SeatAdmin> {
  return apiPost(`/tables/${id}/deactivate`, {}, SeatAdminSchema);
}

export function activateSeat(id: string): Promise<SeatAdmin> {
  return apiPost(`/tables/${id}/activate`, {}, SeatAdminSchema);
}

export function regenerateSeatQr(id: string): Promise<RegenerateQrResponse> {
  return apiPost(`/tables/${id}/qr/regenerate`, {}, RegenerateQrResponseSchema);
}
