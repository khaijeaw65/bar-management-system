/** Same-origin path for the ZXing reader. Never a CDN (DR-026). */
export function slipWasmUrl(file: string): string {
  return `/zxing/${file}`;
}
