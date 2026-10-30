import './set-auth-env.js';
import { Controller, Get } from '@nestjs/common';
import { DiscoveryModule, DiscoveryService, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AnyStaff } from '../src/common/decorators/any-staff.decorator.js';
import { Public } from '../src/common/decorators/public.decorator.js';
import { RequirePermissions } from '../src/common/decorators/require-permissions.decorator.js';
import { AppModule } from '../src/app.module.js';
import { findUnguardedRoutes } from './route-coverage.js';

@Controller('probe')
class ProbeController {
  @Get('naked')
  public naked(): string {
    return 'no decorator';
  }

  @Get('open')
  @Public()
  public open(): string {
    return 'public';
  }

  @Get('any')
  @AnyStaff()
  public any(): string {
    return 'any staff';
  }

  @Get('guarded')
  @RequirePermissions('orders:read')
  public guarded(): string {
    return 'permission';
  }
}

describe('Route permission coverage (e2e)', () => {
  it('AC-8: flags a route with no decorator and nothing else', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DiscoveryModule],
      controllers: [ProbeController],
    }).compile();
    const offenders = findUnguardedRoutes(moduleRef.get(DiscoveryService), new Reflector());
    expect(offenders).toEqual(['ProbeController.naked']);
  });

  it('AC-8: every real route is @Public(), @AnyStaff() or @RequirePermissions()', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    try {
      const offenders = findUnguardedRoutes(moduleRef.get(DiscoveryService), moduleRef.get(Reflector));
      expect(offenders).toEqual([]);
    } finally {
      await moduleRef.close();
    }
  });
});
