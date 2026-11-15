import { AuthMeSchema, type DemoLoginRole } from "@bar/contracts";
import { z } from "zod";
import { apiGet, apiPost, lineLoginUrl } from "./client";

const authOkSchema = z.object({ ok: z.literal(true) });

export function getMe() {
  return apiGet("/auth/me", AuthMeSchema);
}

export function logout() {
  return apiPost("/auth/logout", undefined, authOkSchema);
}

export function demoLogin(role: DemoLoginRole) {
  return apiPost("/auth/demo-login", { role }, authOkSchema);
}

export { lineLoginUrl };
