import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY } from '../guards/permissions.guard.js';

/**
 * @RequirePermission('order:create', 'order:read')
 * Accepts one or more permission strings (action:resource format).
 */
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
