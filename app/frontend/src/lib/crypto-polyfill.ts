/**
 * Polyfill for crypto.randomUUID in non-secure contexts (e.g. testing via http://192.168.x.x on mobile LAN).
 * W3C Web Cryptography API only enables crypto.randomUUID in Secure Contexts (HTTPS / localhost).
 */
if (typeof window !== "undefined") {
  const g = window as unknown as {
    Crypto?: { prototype: { randomUUID?: () => string } };
    crypto?: {
      randomUUID?: () => string;
      getRandomValues?: (arr: Uint8Array) => Uint8Array;
    };
  };

  const polyfill = (): string =>
    "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (ch) => {
      const n = Number(ch);
      const rand =
        typeof g.crypto?.getRandomValues === "function"
          ? g.crypto.getRandomValues(new Uint8Array(1))[0]
          : Math.floor(Math.random() * 256);
      return (n ^ (rand & (15 >> (n / 4)))).toString(16);
    });

  if (typeof g.Crypto !== "undefined" && !g.Crypto.prototype.randomUUID) {
    try {
      g.Crypto.prototype.randomUUID = polyfill;
    } catch {
      // ignore
    }
  }

  if (typeof g.crypto !== "undefined" && !g.crypto.randomUUID) {
    try {
      g.crypto.randomUUID = polyfill;
    } catch {
      try {
        Object.defineProperty(g.crypto, "randomUUID", {
          value: polyfill,
          configurable: true,
          writable: true,
        });
      } catch {
        // ignore
      }
    }
  }
}
