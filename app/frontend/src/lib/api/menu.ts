import {
  MarkAvailabilityResultSchema,
  MenuCategoryListSchema,
  MenuItemListSchema,
  MenuItemSchema,
  ModifierGroupAdminListSchema,
  type CreateMenuItem,
  type UpdateMenuItem,
} from "@bar/contracts";
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
