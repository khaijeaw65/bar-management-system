import { z } from 'zod';
import { IsoDateTimeSchema, UuidSchema } from './common.js';

/** BRIEF-053 §3. `resource:action`. A typo in `@RequirePermissions` fails `typecheck`. */
export const PERMISSION_CODES = [
  'menu:read',
  'menu:write',
  'menu:toggle_availability',
  'orders:read',
  'orders:create',
  'orders:update_status',
  'orders:void',
  'orders:comp',
  'payments:read',
  'payments:create',
  'payments:mark_paid',
  'reports:read',
  'tables:read',
  'tables:manage',
  'visits:read',
  'visits:open',
  'visits:close',
  'venue:read',
  'venue:update',
  'venue:read_payment',
  'venue:update_payment',
  'staff:manage',
] as const;

export const PermissionCodeSchema = z.enum(PERMISSION_CODES);

export type PermissionCode = z.infer<typeof PermissionCodeSchema>;

export const MyPermissionsSchema = z.object({
  permissions: z.array(PermissionCodeSchema),
  groups: z.array(
    z.object({
      id: UuidSchema,
      name: z.string(),
      validUntil: IsoDateTimeSchema.nullable(),
    }),
  ),
});

export type MyPermissions = z.infer<typeof MyPermissionsSchema>;

/** 403 `data` — the codes the caller lacked. */
export const MissingPermissionsSchema = z.object({
  missing: z.array(PermissionCodeSchema),
});

export type MissingPermissions = z.infer<typeof MissingPermissionsSchema>;
