import {
  ImageUploadUrlSchema,
  MarkAvailabilityResultSchema,
  MenuCategoryListSchema,
  MenuItemListSchema,
  MenuItemSchema,
  ModifierGroupAdminListSchema,
  type CreateMenuItem,
  type ImageContentType,
  type ImageUploadUrl,
  type UpdateMenuItem,
} from "@bar/contracts";
import axios from "axios";
import { apiGet, apiPatch, apiPost } from "./client";

export function getMenuItems() {
  return apiGet("/menu/items", MenuItemListSchema);
}

export function getMenuCategories() {
  return apiGet("/menu/categories", MenuCategoryListSchema);
}

// Back office: hidden-category items and the hidden categories themselves (BRIEF-039).
export function getAdminMenuItems() {
  return apiGet("/menu/items?includeHidden=true", MenuItemListSchema);
}

export function getAdminMenuCategories() {
  return apiGet("/menu/categories?includeHidden=true", MenuCategoryListSchema);
}

export function getMenuItem(id: string) {
  return apiGet(`/menu/items/${id}`, MenuItemSchema);
}

export function getModifierGroups() {
  return apiGet("/menu/modifier-groups", ModifierGroupAdminListSchema);
}

export function createMenuItem(body: CreateMenuItem, idempotencyKey: string) {
  return apiPost("/menu/items", body, MenuItemSchema, { idempotencyKey });
}

export function updateMenuItem(id: string, body: UpdateMenuItem) {
  return apiPatch(`/menu/items/${id}`, body, MenuItemSchema);
}

export function setMenuItemAvailable(id: string, available: boolean) {
  const action = available ? "mark-available" : "mark-unavailable";
  return apiPost(`/menu/items/${id}/${action}`, undefined, MarkAvailabilityResultSchema);
}

export function createImageUploadUrl(contentType: ImageContentType) {
  return apiPost("/menu/items/image-upload-url", { contentType }, ImageUploadUrlSchema);
}

// Straight to S3 (DR-020): plain axios, so no API envelope, cookies or refresh retry. `fields` first, the file last.
export async function uploadToS3(
  target: ImageUploadUrl,
  file: File,
  opts: { onProgress: (percent: number) => void; signal: AbortSignal },
) {
  const form = new FormData();
  for (const [name, value] of Object.entries(target.fields)) form.append(name, value);
  form.append("file", file);
  await axios.post(target.url, form, {
    signal: opts.signal,
    onUploadProgress: (event) => opts.onProgress(Math.round((event.progress ?? 0) * 100)),
  });
}
