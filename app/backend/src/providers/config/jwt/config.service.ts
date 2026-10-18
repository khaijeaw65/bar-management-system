import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtConfigService {
  public constructor(private readonly configService: ConfigService) {}

  public get accessSecret(): string {
    return this.configService.getOrThrow('jwt.accessSecret');
  }

  public get accessTtl(): string {
    return this.configService.getOrThrow('jwt.accessTtl');
  }

  public get accessTtlSeconds(): number {
    return this.configService.getOrThrow('jwt.accessTtlSeconds');
  }

  public get refreshTtlDays(): number {
    return this.configService.getOrThrow('jwt.refreshTtlDays');
  }

  public get refreshTtlSeconds(): number {
    return this.configService.getOrThrow('jwt.refreshTtlSeconds');
  }

  public get mobileRefreshTtlDays(): number {
    return this.configService.getOrThrow('jwt.mobileRefreshTtlDays');
  }

  public get mobileRefreshTtlSeconds(): number {
    return this.configService.getOrThrow('jwt.mobileRefreshTtlSeconds');
  }
}
