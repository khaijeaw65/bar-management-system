/**
 * Safe RFC-4122 v4 UUID generator.
 * Falls back to crypto.getRandomValues or Math.random when in non-secure contexts
 * (e.g. mobile/tablet accessing via http://192.168.x.x where crypto.randomUUID is disabled by W3C spec).
 */
export function generateUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      +c ^
      ((typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function"
        ? crypto.getRandomValues(new Uint8Array(1))[0]
        : Math.floor(Math.random() * 256)) &
        (15 >> (+c / 4)))
    ).toString(16),
  );
}
