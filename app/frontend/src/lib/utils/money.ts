export function toSatang(value: string): number {
  const [whole = "0", fraction = ""] = value.split(".");
  const digits = `${fraction}00`.slice(0, 2);
  const satang = Number(whole) * 100 + Number(digits);
  return Number.isFinite(satang) ? satang : Number.NaN;
}

export function fromSatang(satang: number): string {
  const sign = satang < 0 ? "-" : "";
  const abs = Math.abs(satang);
  return `${sign}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export function sumMoney(values: readonly string[]): string {
  return fromSatang(values.reduce((total, value) => total + toSatang(value), 0));
}

export function scaleMoney(value: string, quantity: number): string {
  return fromSatang(toSatang(value) * quantity);
}

export function cmpMoney(left: string, right: string): number {
  return toSatang(left) - toSatang(right);
}

export function lowestMoney(values: readonly string[]): string {
  return values.reduce((min, price) => (cmpMoney(price, min) < 0 ? price : min));
}
