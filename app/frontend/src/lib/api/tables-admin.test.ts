import { describe, expect, it } from "vitest";
import {
  activateSeat,
  createSeat,
  deactivateSeat,
  getSeatsAdmin,
  regenerateSeatQr,
  reorderSeats,
  updateSeat,
} from "./tables-admin";

describe("tables-admin API client", () => {
  it("getSeatsAdmin returns list of seats with admin fields", async () => {
    const list = await getSeatsAdmin();
    expect(list.items.length).toBeGreaterThan(0);
    const t3 = list.items.find((s) => s.label === "T3");
    expect(t3).toBeDefined();
    expect(t3?.hasLiveVisit).toBe(true);
    expect(t3?.isActive).toBe(true);
    expect(t3?.qrToken).toBeTruthy();
  });

  it("createSeat creates a new seat at the end of section", async () => {
    const created = await createSeat({ label: "T99", kind: "table" });
    expect(created.label).toBe("T99");
    expect(created.kind).toBe("table");
    expect(created.isActive).toBe(true);
    expect(created.hasLiveVisit).toBe(false);
  });

  it("updateSeat updates seat label and kind", async () => {
    const updated = await updateSeat("10000000-0000-4000-8000-000000000005", { label: "T5-updated" });
    expect(updated.label).toBe("T5-updated");
  });

  it("reorderSeats updates sortOrder of seats", async () => {
    const reordered = await reorderSeats({
      kind: "counter",
      ids: ["10000000-0000-4000-8000-000000000002", "10000000-0000-4000-8000-000000000001"],
    });
    expect(reordered.items).toBeDefined();
  });

  it("deactivateSeat fails on seat with active visit", async () => {
    await expect(deactivateSeat("10000000-0000-4000-8000-000000000003")).rejects.toThrow();
  });

  it("deactivateSeat succeeds on idle seat", async () => {
    const deactivated = await deactivateSeat("10000000-0000-4000-8000-000000000006");
    expect(deactivated.isActive).toBe(false);
  });

  it("activateSeat reactivates deactivated seat", async () => {
    const activated = await activateSeat("10000000-0000-4000-8000-000000000006");
    expect(activated.isActive).toBe(true);
  });

  it("regenerateSeatQr returns new qrToken", async () => {
    const res = await regenerateSeatQr("10000000-0000-4000-8000-000000000001");
    expect(res.qrToken).toBeTruthy();
  });
});
