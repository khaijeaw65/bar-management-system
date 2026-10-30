import { PATH_METADATA } from '@nestjs/common/constants.js';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { ANY_STAFF_KEY } from '../src/common/decorators/any-staff.decorator.js';
import { IS_PUBLIC_KEY } from '../src/common/decorators/public.decorator.js';
import { PERMISSIONS_KEY } from '../src/common/guards/permissions.guard.js';

/** Every HTTP route that is neither @Public(), @RequirePermissions() nor @AnyStaff(), as "Controller.handler". */
export function findUnguardedRoutes(discovery: DiscoveryService, reflector: Reflector): string[] {
  const scanner = new MetadataScanner();
  const offenders: string[] = [];
  for (const wrapper of discovery.getControllers()) {
    const { instance, metatype } = wrapper;
    if (!instance || !metatype) continue;
    for (const name of scanner.getAllMethodNames(Object.getPrototypeOf(instance))) {
      const handler = (instance as Record<string, unknown>)[name] as (...args: unknown[]) => unknown;
      if (reflector.get(PATH_METADATA, handler) === undefined) continue;
      const targets = [handler, metatype];
      const guarded =
        reflector.getAllAndOverride(IS_PUBLIC_KEY, targets) ||
        reflector.getAllAndOverride(ANY_STAFF_KEY, targets) ||
        (reflector.getAllAndOverride<string[] | undefined>(PERMISSIONS_KEY, targets)?.length ?? 0) > 0;
      if (!guarded) offenders.push(`${metatype.name}.${name}`);
    }
  }
  return offenders;
}
