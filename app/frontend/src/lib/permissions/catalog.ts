import type { PermissionCatalog, PermissionCode } from "@bar/contracts";

/** code → Thai label, read from the catalog the server serves (BRIEF-055) — never typed in the UI. */
export function labelsOf(catalog: PermissionCatalog): Map<PermissionCode, string> {
  return new Map(catalog.flatMap((resource) => resource.actions.map((action) => [action.code, action.label] as const)));
}

/** The full set in catalog order, so a PUT always carries a stable, de-duplicated list. */
export function orderedCodes(catalog: PermissionCatalog, chosen: ReadonlySet<PermissionCode>): PermissionCode[] {
  return catalog.flatMap((resource) => resource.actions.map((action) => action.code)).filter((code) => chosen.has(code));
}
