import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { AppConfigModule } from '../../providers/config/app/config.module.js';
import { JwtConfigModule } from '../../providers/config/jwt/config.module.js';
import { JwtConfigService } from '../../providers/config/jwt/config.service.js';
import { LineConfigModule } from '../../providers/config/line/config.module.js';
import { RedisModule } from '../../providers/redis/redis.module.js';
import { IamModule } from '../iam/iam.module.js';
import { AuthService } from './application/auth.service.js';
import { TokenService } from './application/token.service.js';
import { LINE_CLIENT } from './domain/line-client.js';
import { AuthController } from './infrastructure/http/auth.controller.js';
import { JwtStrategy } from './infrastructure/http/jwt.strategy.js';
import { LineClientHttp } from './infrastructure/line/line-client.http.js';

@Module({
  imports: [
    PassportModule,
    AppConfigModule,
    JwtConfigModule,
    LineConfigModule,
    RedisModule,
    IamModule,
    JwtModule.registerAsync({
      imports: [JwtConfigModule],
      inject: [JwtConfigService],
      useFactory: (jwt: JwtConfigService) => ({
        secret: jwt.accessSecret,
        signOptions: {
          algorithm: 'HS256',
          expiresIn: jwt.accessTtlSeconds,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    JwtStrategy,
    { provide: LINE_CLIENT, useClass: LineClientHttp },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AuthModule {}
