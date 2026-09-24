import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY } from '../guards/permissions.guard.js';

/**
 * @RequirePermissions('orders:create', 'orders:read')
 * Accepts one or more permission strings (resource:action format).
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
