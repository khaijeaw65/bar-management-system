import { MenuCategoryListSchema, MenuItemListSchema } from "@bar/contracts";
import { apiGet } from "./client";

export function getMenuItems() {
  return apiGet("/menu/items", MenuItemListSchema);
}

export function getMenuCategories() {
  return apiGet("/menu/categories", MenuCategoryListSchema);
}
