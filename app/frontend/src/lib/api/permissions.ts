import { MyPermissionsSchema } from "@bar/contracts";
import { apiGet } from "./client";

export const MY_PERMISSIONS_KEY = ["me", "permissions"] as const;

export function getMyPermissions() {
  return apiGet("/me/permissions", MyPermissionsSchema);
}
