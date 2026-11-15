import { describe, expect, it } from "vitest";
import { compOrderItem, voidOrderItem } from "./void-comp";

describe("void-comp API client", () => {
  it("voidOrderItem voids item with valid PIN", async () => {
    const item = await voidOrderItem("70000000-0000-4000-8000-000000000001", {
      reason: "out_of_stock",
      pin: "1234",
    });
    expect(item.id).toBe("70000000-0000-4000-8000-000000000001");
    expect(item.cancelledAt).toBeTruthy();
    expect(item.cancellation?.reason).toBe("out_of_stock");
  });

  it("compOrderItem comps item with valid PIN", async () => {
    const item = await compOrderItem("70000000-0000-4000-8000-000000000002", {
      reason: "special_service",
      pin: "1234",
    });
    expect(item.id).toBe("70000000-0000-4000-8000-000000000002");
    expect(item.lineTotal).toBe("0.00");
  });

  it("fails with 422 when wrong PIN is entered", async () => {
    await expect(
      voidOrderItem("70000000-0000-4000-8000-000000000001", {
        reason: "wrong_order",
        pin: "9999",
      }),
    ).rejects.toThrow();
  });
});
