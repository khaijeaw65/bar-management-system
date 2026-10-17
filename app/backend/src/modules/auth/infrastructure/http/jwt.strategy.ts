import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { CurrentUserPayload } from '../../../../common/decorators/current-user.types.js';
import { JwtConfigService } from '../../../../providers/config/jwt/config.service.js';
import { TokenService } from '../../application/token.service.js';
import type { AccessClaims } from '../../application/token.types.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  public constructor(
    jwtConfig: JwtConfigService,
    private readonly tokenService: TokenService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request.cookies?.access_token || null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: jwtConfig.accessSecret,
      algorithms: ['HS256'],
    });
  }

  public async validate(payload: AccessClaims): Promise<CurrentUserPayload> {
    const user = await this.tokenService.authenticateClaims(payload);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
