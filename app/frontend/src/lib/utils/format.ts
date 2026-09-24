const thb = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
});

export function formatTHB(decimalString: string): string {
  return thb.format(Number(decimalString));
}
