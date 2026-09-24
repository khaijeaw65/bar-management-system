import { z } from "zod";
import { apiFetch } from "./client";

const decimalString = z.string().regex(/^\d+\.\d{2}$/);

export const menuItemSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  category: z.string(),
  price: decimalString,
  isAvailable: z.boolean(),
});

export const menuListSchema = z.object({
  items: z.array(menuItemSchema),
});

export type MenuItem = z.infer<typeof menuItemSchema>;

export function getMenuItems() {
  return apiFetch("/menu/items", menuListSchema);
}
