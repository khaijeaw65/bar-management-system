import { SetMetadata, type CustomDecorator } from '@nestjs/common';

export const ANY_STAFF_KEY = 'anyStaff';

/** Marker: any logged-in staff member may call this route (e.g. /auth/me). Keeps the route-coverage test honest. */
export const AnyStaff = (): CustomDecorator<string> => SetMetadata(ANY_STAFF_KEY, true);
