import type { MenuCategory, MenuItem, MenuModifierGroup, ModifierGroupAdmin, UpdateMenuItem } from "@bar/contracts";
import { http, HttpResponse } from "msw";

export const iceGroupId = "e1111111-1111-4111-8111-111111111111";

const iceGroup: MenuModifierGroup = {
  id: iceGroupId,
  name: "ระดับน้ำแข็ง",
  isRequired: true,
  minSelect: 1,
  maxSelect: 1,
  options: [
    { id: "e1111111-0000-4000-8000-000000000001", name: "ปกติ", priceDelta: "0.00", isAvailable: true },
    { id: "e1111111-0000-4000-8000-000000000002", name: "น้ำแข็งน้อย", priceDelta: "0.00", isAvailable: true },
  ],
};

const plainGroups: MenuModifierGroup[] = [iceGroup];
export const modifierGroups: ModifierGroupAdmin[] = plainGroups.map((group) => ({ ...group, usedByItems: 0 }));

// Item state for the editor mocks; rebuilt from the seed per test (resetMenu) so writes never leak.
// The seed comes in through createMenuHandlers so this file never imports handlers.ts (no cycle).
let seed: MenuItem[] = [];
let items: MenuItem[] | null = null;
const createdByKey = new Map<string, MenuItem>();

function state(): MenuItem[] {
  items ??= structuredClone(seed);
  return items;
}

export function resetMenu(): void {
  items = null;
  createdByKey.clear();
}

function json(data: unknown, status = 200, code = "", message = "success") {
  return HttpResponse.json({ status, code, message, data }, { status });
}

type ItemInput = Omit<UpdateMenuItem, "updatedAt">;

// A tiny inline image, so mocked thumbnails render with no network.
export const mockImageUrl = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="4" height="3"><rect width="4" height="3" fill="#888"/></svg>')}`;
export const mockBucket = "https://mock-bucket.test/";

function imageOf(input: ItemInput, current: MenuItem | null): string | null {
  if (input.imageKey === undefined) return current?.imageUrl ?? null;
  return input.imageKey === null ? null : mockImageUrl;
}

function build(id: string, input: ItemInput, sortOrder: number, current: MenuItem | null = null): MenuItem {
  const groups = plainGroups.filter((group) => input.modifierGroupIds?.includes(group.id));
  const variants = input.variants.map((variant) => ({
    id: variant.id ?? crypto.randomUUID(),
    name: variant.name,
    price: variant.price,
    isAvailable: true,
    modifierGroups: groups,
  }));
  return {
    id,
    categoryId: input.categoryId,
    name: input.name,
    description: input.description ?? null,
    imageUrl: imageOf(input, current),
    itemType: input.itemType,
    station: input.station,
    isPromo: input.isPromo,
    basePrice: variants[0]?.price ?? "0.00",
    sortOrder,
    availableNow: true,
    unavailableReason: null,
    windows: [],
    variants,
    updatedAt: new Date().toISOString(),
  };
}

export function createMenuHandlers(initialItems: MenuItem[], menuCategories: MenuCategory[]) {
  seed = initialItems;
  return [
  http.get("*/api/menu/items", () => json({ items: state() })),
  http.get("*/api/menu/categories", () => json({ items: menuCategories })),
  http.get("*/api/menu/modifier-groups", () => json({ items: modifierGroups })),
  http.get("*/api/menu/items/:id", ({ params }) => {
    const found = state().find((item) => item.id === params.id);
    return found ? json(found) : json(null, 404, "NOT_FOUND", "ไม่พบเมนู");
  }),
  http.post("*/api/menu/items/image-upload-url", async ({ request }) => {
    const { contentType } = (await request.json()) as { contentType: string };
    const key = `tmp/${crypto.randomUUID()}.${contentType === "image/png" ? "png" : "jpg"}`;
    return json({ url: mockBucket, fields: { key, "Content-Type": contentType }, key, expiresAt: new Date(Date.now() + 600_000).toISOString() });
  }),
  http.post(`${mockBucket}`, () => new HttpResponse(null, { status: 204 })),
  http.post("*/api/menu/items/:id/:action", ({ params }) => {
    const found = state().find((item) => item.id === params.id);
    if (!found) return json(null, 404, "NOT_FOUND", "ไม่พบเมนู");
    const soldOut = params.action === "mark-unavailable";
    const next: MenuItem = {
      ...found,
      availableNow: !soldOut,
      unavailableReason: soldOut ? "sold_out" : null,
    };
    items = state().map((item) => (item.id === found.id ? next : item));
    return json({ item: next, autoVoided: [], notVoided: [] });
  }),
  http.post("*/api/menu/items", async ({ request }) => {
    const key = request.headers.get("idempotency-key");
    const replay = key ? createdByKey.get(key) : undefined;
    if (replay) return json(replay, 201);
    const created = build(crypto.randomUUID(), (await request.json()) as ItemInput, state().length);
    items = [...state(), created];
    if (key) createdByKey.set(key, created);
    return json(created, 201);
  }),
  http.patch("*/api/menu/items/:id", async ({ request, params }) => {
    const found = state().find((item) => item.id === params.id);
    if (!found) return json(null, 404, "NOT_FOUND", "ไม่พบเมนู");
    const body = (await request.json()) as UpdateMenuItem;
    if (Date.parse(body.updatedAt) < Date.parse(found.updatedAt)) {
      return json({ details: found }, 409, "MENU_ITEM_STALE", "มีคนบันทึกเมนูนี้ก่อน โหลดใหม่แล้วแก้อีกครั้ง");
    }
    const next = build(found.id, body, found.sortOrder, found);
    // A save stamps a new updatedAt; keep it strictly later than the loaded one.
    next.updatedAt = new Date(Math.max(Date.now(), Date.parse(found.updatedAt) + 1)).toISOString();
    items = state().map((item) => (item.id === found.id ? next : item));
    return json(next);
  }),
];
}
