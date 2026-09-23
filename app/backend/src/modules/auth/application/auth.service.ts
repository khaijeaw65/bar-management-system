import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// TODO: implement LINE SSO exchange, JWT issuance, refresh token rotation
@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}
}
