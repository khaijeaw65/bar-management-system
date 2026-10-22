import {
  VenuePaymentSettingsSchema,
  VenueSettingsSchema,
  type UpdateVenuePaymentSettings,
  type UpdateVenueSettings,
} from "@bar/contracts";
import { apiGet, apiPatch } from "./client";

export function getVenue() {
  return apiGet("/venue", VenueSettingsSchema);
}

export function updateVenueSettings(body: UpdateVenueSettings) {
  return apiPatch("/venue/settings", body, VenueSettingsSchema);
}

export function getPaymentSettings() {
  return apiGet("/venue/payment-settings", VenuePaymentSettingsSchema);
}

export function updatePaymentSettings(body: UpdateVenuePaymentSettings) {
  return apiPatch("/venue/payment-settings", body, VenuePaymentSettingsSchema);
}
