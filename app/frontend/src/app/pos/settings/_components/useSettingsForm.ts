"use client";

import { UpdateVenueSettingsSchema, type UpdateVenueSettings, type VenueSettings } from "@bar/contracts";
import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { VENUE_KEY } from "@/hooks/useVenueEvents";
import { ApiError } from "@/lib/api/errors";
import { updateVenueSettings } from "@/lib/api/venue";

export type SettingsDraft = Pick<VenueSettings, "name" | "businessDayCutoff" | "kitchenDisplayEnabled" | "counterQrEnabled">;
export type DraftField = keyof SettingsDraft;

const FIELDS: DraftField[] = ["name", "businessDayCutoff", "kitchenDisplayEnabled", "counterQrEnabled"];

export function draftOf(venue: VenueSettings): SettingsDraft {
  return {
    name: venue.name,
    businessDayCutoff: venue.businessDayCutoff,
    kitchenDisplayEnabled: venue.kitchenDisplayEnabled,
    counterQrEnabled: venue.counterQrEnabled,
  };
}

export function changedFields(saved: SettingsDraft, draft: SettingsDraft): UpdateVenueSettings {
  return Object.fromEntries(FIELDS.filter((key) => saved[key] !== draft[key]).map((key) => [key, draft[key]]));
}

// Same schema as the server, so every rule shows under its field before sending (DR-021 B).
export function fieldErrors(patch: UpdateVenueSettings): Partial<Record<DraftField, string>> {
  const parsed = UpdateVenueSettingsSchema.safeParse(patch);
  if (parsed.success || Object.keys(patch).length === 0) return {};
  const errors: Partial<Record<DraftField, string>> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0] as DraftField | undefined;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export function useSettingsForm(venue: VenueSettings) {
  const client = useQueryClient();
  const saved = draftOf(venue);
  const [draft, setDraft] = useState<SettingsDraft>(saved);
  const patch = changedFields(saved, draft);
  const errors = fieldErrors(patch);
  const mutation = useMutation({
    mutationFn: updateVenueSettings,
    onSuccess: (next) => {
      client.setQueryData(VENUE_KEY, next);
      setDraft(draftOf(next));
      toast.success("บันทึกแล้ว");
    },
  });
  const failure = mutation.error instanceof ApiError ? mutation.error.message : null;

  return {
    draft,
    errors,
    dirty: Object.keys(patch).length > 0,
    failure: mutation.isError ? (failure ?? "บันทึกไม่สำเร็จ ลองอีกครั้ง") : null,
    pending: mutation.isPending,
    set: <K extends DraftField>(key: K, value: SettingsDraft[K]) => {
      setDraft((current) => ({ ...current, [key]: value }));
      mutation.reset();
    },
    save: () => {
      if (Object.keys(patch).length === 0 || Object.keys(errors).length > 0 || mutation.isPending) return;
      mutation.mutate(patch);
    },
  };
}
