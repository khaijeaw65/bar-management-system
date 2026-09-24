import { http, HttpResponse } from "msw";

export const menuItems = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "สิงห์",
    category: "เบียร์",
    price: "120.00",
    isAvailable: true,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "โมฮิโต้",
    category: "ค็อกเทล",
    price: "180.00",
    isAvailable: true,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "ปีกไก่ทอด",
    category: "อาหาร",
    price: "150.00",
    isAvailable: true,
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "วิสกี้ซาวร์",
    category: "ค็อกเทล",
    price: "220.00",
    isAvailable: false,
  },
];

export const handlers = [
  http.get("*/api/menu/items", () =>
    HttpResponse.json({
      status: 200,
      message: "success",
      data: { items: menuItems },
    }),
  ),
];
