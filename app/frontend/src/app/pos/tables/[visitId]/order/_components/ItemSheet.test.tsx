import type { MenuItem } from "@bar/contracts";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { ItemSheet } from "./ItemSheet";

const cherry = "dddddddd-dddd-4ddd-8ddd-ddddddddddd1";
const peel = "dddddddd-dddd-4ddd-8ddd-ddddddddddd2";
const smoke = "dddddddd-dddd-4ddd-8ddd-ddddddddddd3";

const item: MenuItem = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
  categoryId: "c2222222-2222-4222-8222-222222222222",
  name: "โอลด์แฟชั่น",
  description: null,
  imageUrl: null,
  itemType: "simple",
  station: "bar",
  isPromo: false,
  basePrice: "260.00",
  sortOrder: 0,
  availableNow: true,
  unavailableReason: null,
  windows: [],
  variants: [
    {
      id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc1",
      name: "ปกติ",
      price: "260.00",
      isAvailable: true,
      modifierGroups: [
        {
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          name: "ท็อปปิ้ง",
          isRequired: true,
          minSelect: 1,
          maxSelect: 2,
          options: [
            { id: cherry, name: "เชอร์รี่", priceDelta: "20.00", isAvailable: true },
            { id: peel, name: "เปลือกส้ม", priceDelta: "0.00", isAvailable: true },
            { id: smoke, name: "ควัน", priceDelta: "20.00", isAvailable: true },
          ],
        },
      ],
    },
  ],
};

test("keeps add disabled until a required group is met and stops at maxSelect", async () => {
  const user = userEvent.setup();
  const onAdd = vi.fn();
  render(<ItemSheet item={item} names={[]} onClose={vi.fn()} onRemember={vi.fn()} onAdd={onAdd} />);

  const add = screen.getByRole("button", { name: /เพิ่มลงตะกร้า/ });
  expect(add).toBeDisabled();
  expect(screen.getByText("กรุณาเลือกท็อปปิ้ง")).toBeInTheDocument();

  await user.click(screen.getByRole("checkbox", { name: /เชอร์รี่/ }));
  expect(add).toBeEnabled();
  await user.click(screen.getByRole("checkbox", { name: /เปลือกส้ม/ }));
  expect(screen.getByText("เลือกได้สูงสุด 2")).toBeInTheDocument();
  expect(screen.getByRole("checkbox", { name: /ควัน/ })).toBeDisabled();

  await user.click(add);
  expect(onAdd).toHaveBeenCalledOnce();
  expect(onAdd.mock.calls[0]?.[0]).toMatchObject({
    modifierOptionIds: [cherry, peel],
    quantity: 1,
    unitPrice: "280.00",
  });
});
