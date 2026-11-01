import type { PermissionCode } from "@bar/contracts";

// The one page → permission map (BRIEF-056). The rail and the route guard both read it; first match wins.
const RULES: ReadonlyArray<{ pattern: RegExp; needs: PermissionCode }> = [
  { pattern: /^\/pos\/tables\/[^/]+\/order\/?$/, needs: "orders:create" },
  { pattern: /^\/pos\/tables\/?$/, needs: "tables:read" },
  { pattern: /^\/pos\/orders(\/|$)/, needs: "orders:read" },
  { pattern: /^\/pos\/menu\/modifiers\/?$/, needs: "menu:read" },
  { pattern: /^\/pos\/menu\/[^/]+\/?$/, needs: "menu:write" },
  { pattern: /^\/pos\/menu\/?$/, needs: "menu:read" },
  { pattern: /^\/pos\/reports(\/|$)/, needs: "reports:read" },
  // Tables administration (BRIEF-069, CD-13)
  { pattern: /^\/pos\/settings\/tables(\/|$)/, needs: "tables:manage" },
  // Before the general settings rule (first match wins): staff:manage alone reaches these (BRIEF-057, DR-029).
  { pattern: /^\/pos\/settings\/(staff|groups|policies)(\/|$)/, needs: "staff:manage" },
  // DR-029 (Field 2026-10-31): the settings page is back-office; พนักงาน holds venue:read but must not see it.
  { pattern: /^\/pos\/settings(\/|$)/, needs: "venue:update" },
];

export const POS_START_PAGES = [
  { href: "/pos/tables", label: "โต๊ะ" },
  { href: "/pos/orders", label: "ออเดอร์" },
  { href: "/pos/menu", label: "เมนู" },
  { href: "/pos/reports", label: "รายงาน" },
  { href: "/pos/settings", label: "ตั้งค่า" },
] as const;

export type PosStartPage = (typeof POS_START_PAGES)[number];

/** The permission a path needs, or null for a path outside the map (no gate). */
export function permissionForPath(pathname: string): PermissionCode | null {
  return RULES.find((rule) => rule.pattern.test(pathname))?.needs ?? null;
}

/** The first top-level page the person can open, in rail order. */
export function firstAllowedPage(can: (code: PermissionCode) => boolean): PosStartPage | null {
  return (
    POS_START_PAGES.find((page) => {
      const needs = permissionForPath(page.href);
      return needs === null || can(needs);
    }) ?? null
  );
}
