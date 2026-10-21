import { OrderSchema, type PlaceOrderRequest } from "@bar/contracts";
import { apiPost } from "./client";

export function placeOrder(visitId: string, body: PlaceOrderRequest, idempotencyKey: string) {
  return apiPost(`/visits/${visitId}/orders`, body, OrderSchema, { idempotencyKey });
}
