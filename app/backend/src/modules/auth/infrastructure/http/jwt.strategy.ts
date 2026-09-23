import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
// TODO: implement jwt.strategy
@Injectable()
export class JwtStrategy extends PassportStrategy(Object as any, 'jwt') {}
