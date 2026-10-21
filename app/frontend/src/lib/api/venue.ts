import { VenueSettingsSchema } from "@bar/contracts";
import { apiGet } from "./client";

export function getVenue() {
  return apiGet("/venue", VenueSettingsSchema);
}
