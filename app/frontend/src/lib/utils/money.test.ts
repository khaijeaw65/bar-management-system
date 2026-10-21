import { expect, test } from "vitest";
import { cmpMoney, lowestMoney, scaleMoney, sumMoney, toSatang } from "./money";

test("adds and scales money in satang", () => {
  expect(sumMoney(["0.10", "0.20"])).toBe("0.30");
  expect(scaleMoney("33.33", 3)).toBe("99.99");
  expect(sumMoney(["33.33", "33.33", "33.33"])).toBe("99.99");
});

test("compares decimal strings without float drift", () => {
  expect(cmpMoney("180.00", "240.00")).toBeLessThan(0);
  expect(lowestMoney(["240.00", "180.00"])).toBe("180.00");
  expect(toSatang("nope")).toBeNaN();
});
