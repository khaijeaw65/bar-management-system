import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './application/auth.service.js';
import { LineStrategy } from './infrastructure/http/line.strategy.js';
import { JwtStrategy } from './infrastructure/http/jwt.strategy.js';
import { JwtRefreshStrategy } from './infrastructure/http/jwt-refresh.strategy.js';
import { AuthController } from './infrastructure/http/auth.controller.js';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env['JWT_SECRET'],
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  providers: [AuthService, LineStrategy, JwtStrategy, JwtRefreshStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
