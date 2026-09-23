import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
// TODO: implement jwt-refresh.strategy
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Object as any, 'jwt-refresh') {}
