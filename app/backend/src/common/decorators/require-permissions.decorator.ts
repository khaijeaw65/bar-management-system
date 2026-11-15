import { SetMetadata, type CustomDecorator } from '@nestjs/common';
import type { PermissionCode } from '@bar/contracts';
import { PERMISSIONS_KEY } from '../guards/permissions.guard.js';

/**
 * @RequirePermissions('orders:create', 'orders:read')
 * Every listed code is required. Codes come from the contracts catalog, so a typo fails typecheck.
 */
export const RequirePermissions = (
  ...permissions: PermissionCode[]
): CustomDecorator<string> => SetMetadata(PERMISSIONS_KEY, permissions);
