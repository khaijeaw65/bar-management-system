import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppConfigModule } from '../../providers/config/app/config.module.js';
import { JwtConfigModule } from '../../providers/config/jwt/config.module.js';
import { JwtConfigService } from '../../providers/config/jwt/config.service.js';
import { LineConfigModule } from '../../providers/config/line/config.module.js';
import { RedisModule } from '../../providers/redis/redis.module.js';
import { IamModule } from '../iam/iam.module.js';
import { AuthService } from './application/auth.service.js';
import { TokenService } from './application/token.service.js';
import { LineClient } from './domain/ports/line-client.port.js';
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
    { provide: LineClient, useClass: LineClientHttp },
  ],
  exports: [TokenService],
})
export class AuthModule {}
