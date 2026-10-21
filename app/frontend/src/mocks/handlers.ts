import type { MenuItem } from "@bar/contracts";
import { http, HttpResponse } from "msw";

export const staffMe = {
  id: "11111111-1111-4111-8111-111111111111",
  displayName: "Beam",
  avatarUrl: null,
};

const beerId = "c1111111-1111-4111-8111-111111111111";
const cocktailId = "c2222222-2222-4222-8222-222222222222";
const foodId = "c3333333-3333-4333-8333-333333333333";

export const menuCategories = [
  { id: beerId, name: "เบียร์", sortOrder: 0 },
  { id: cocktailId, name: "ค็อกเทล", sortOrder: 1 },
  { id: foodId, name: "อาหาร", sortOrder: 2 },
];

function item(
  overrides: Pick<MenuItem, "id" | "categoryId" | "name" | "basePrice"> & Partial<MenuItem>,
): MenuItem {
  return {
    description: null,
    imageUrl: null,
    itemType: "simple",
    station: "bar",
    isPromo: false,
    sortOrder: 0,
    availableNow: true,
    unavailableReason: null,
    windows: [],
    variants: [
      {
        id: overrides.id,
        name: "ปกติ",
        price: overrides.basePrice,
        isAvailable: true,
        modifierGroups: [],
      },
    ],
    ...overrides,
  };
}

export const menuItems: MenuItem[] = [
  item({
    id: "11111111-1111-4111-8111-111111111111",
    categoryId: beerId,
    name: "สิงห์",
    basePrice: "120.00",
  }),
  item({
    id: "22222222-2222-4222-8222-222222222222",
    categoryId: cocktailId,
    name: "โมฮิโต้",
    basePrice: "180.00",
    variants: [
      {
        id: "22222222-2222-4222-8222-222222222222",
        name: "ปกติ",
        price: "180.00",
        isAvailable: true,
        modifierGroups: [],
      },
      {
        id: "55555555-5555-4555-8555-555555555555",
        name: "ใหญ่",
        price: "240.00",
        isAvailable: true,
        modifierGroups: [],
      },
    ],
  }),
  item({
    id: "33333333-3333-4333-8333-333333333333",
    categoryId: foodId,
    name: "ปีกไก่ทอด",
    basePrice: "150.00",
    station: "food",
    isPromo: true,
    availableNow: false,
    unavailableReason: "out_of_window",
  }),
  item({
    id: "44444444-4444-4444-8444-444444444444",
    categoryId: cocktailId,
    name: "วิสกี้ซาวร์",
    basePrice: "220.00",
    availableNow: false,
    unavailableReason: "sold_out",
  }),
];

export function apiEnvelope(
  data: unknown,
  status = 200,
  code = "",
  message: string | string[] = "success",
) {
  return { status, code, message, data };
}

function json(data: unknown, status = 200, code = "", message = "success") {
  return HttpResponse.json(apiEnvelope(data, status, code, message), { status });
}

export const handlers = [
  http.get("*/api/auth/me", () => json(staffMe)),
  http.post("*/api/auth/refresh", () => json({ ok: true })),
  http.post("*/api/auth/logout", () => json({ ok: true })),
  http.get("*/api/menu/items", () => json({ items: menuItems })),
  http.get("*/api/menu/categories", () => json({ items: menuCategories })),
];
