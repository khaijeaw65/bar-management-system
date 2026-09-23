import { Controller, Get, Post, UseGuards, Req, Res, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../../application/auth.service.js';

// TODO: LINE callback, /auth/refresh, /auth/logout
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('line')
  @UseGuards(AuthGuard('line'))
  lineLogin(): void { /* redirect handled by LineStrategy */ }
}
