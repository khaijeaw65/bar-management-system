import { describe, expect, it } from "vitest";
import { generateUuid } from "./uuid";

describe("generateUuid", () => {
  it("generates a valid UUID string in native crypto environment", () => {
    const id = generateUuid();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it("falls back gracefully when crypto.randomUUID is undefined", () => {
    const originalRandomUUID = crypto.randomUUID;
    // Simulate non-secure context (e.g. LAN HTTP) where randomUUID is absent
    Reflect.deleteProperty(crypto, "randomUUID");

    try {
      const id = generateUuid();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    } finally {
      crypto.randomUUID = originalRandomUUID;
    }
  });
});
