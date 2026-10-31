"use client";

import { PolicyInUseDataSchema } from "@bar/contracts";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { ApiError } from "@/lib/api/errors";
import { POLICIES_KEY } from "@/lib/api/iam";
import { ACCESS_REQUESTS_KEY, STAFF_GROUPS_KEY, STAFF_KEY } from "@/lib/api/staff";
import { MY_PERMISSIONS_KEY } from "@/lib/api/permissions";

/** After any IAM write: staff, requests and the caller's own permissions are all stale (BRIEF-057). */
export function useRefreshIam(): () => Promise<void> {
  const client = useQueryClient();
  return useCallback(async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: STAFF_KEY }),
      client.invalidateQueries({ queryKey: ["staff", "member"] }),
      client.invalidateQueries({ queryKey: ["staff", "effective"] }),
      client.invalidateQueries({ queryKey: STAFF_GROUPS_KEY }),
      client.invalidateQueries({ queryKey: POLICIES_KEY }),
      client.invalidateQueries({ queryKey: ACCESS_REQUESTS_KEY }),
      client.invalidateQueries({ queryKey: MY_PERMISSIONS_KEY }),
    ]);
  }, [client]);
}

export const LOCKOUT_COPY = "ต้องมีผู้ดูแลสิทธิ์อย่างน้อย 1 คนที่ไม่มีวันหมดอายุ";

export type IamFailure =
  | { kind: "lockout"; message: string }
  | { kind: "decided"; message: string }
  | { kind: "self"; message: string }
  | { kind: "in_use"; message: string; groups: string[]; users: string[] }
  | { kind: "name_taken"; message: string }
  | { kind: "other"; message: string };

/** CD-13 §4 — the codes the staff screens explain; anything else shows the server's own Thai message. */
export function iamFailure(error: unknown): IamFailure {
  if (!(error instanceof ApiError)) return { kind: "other", message: "บันทึกไม่สำเร็จ ลองอีกครั้ง" };
  if (error.code === "IAM_LOCKOUT") return { kind: "lockout", message: LOCKOUT_COPY };
  if (error.code === "ACCESS_REQUEST_DECIDED") return { kind: "decided", message: "คำขอนี้ถูกจัดการแล้ว" };
  if (error.code === "GROUP_NAME_TAKEN" || error.code === "POLICY_NAME_TAKEN") return { kind: "name_taken", message: error.message };
  if (error.code === "POLICY_IN_USE") {
    const parsed = PolicyInUseDataSchema.safeParse(error.data);
    return { kind: "in_use", message: error.message, groups: parsed.success ? parsed.data.groups : [], users: parsed.success ? parsed.data.users : [] };
  }
  if (error.code === "SELF_DEACTIVATE") return { kind: "self", message: "ปิดบัญชีของตัวเองไม่ได้" };
  if (error.status === 0) return { kind: "other", message: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ ลองอีกครั้ง" };
  return { kind: "other", message: error.message };
}
