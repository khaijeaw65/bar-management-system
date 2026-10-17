import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtConfigService {
  constructor(private readonly configService: ConfigService) {}

  get accessSecret(): string {
    return this.configService.getOrThrow('jwt.accessSecret');
  }

  get accessTtl(): string {
    return this.configService.getOrThrow('jwt.accessTtl');
  }

  get accessTtlSeconds(): number {
    return this.configService.getOrThrow('jwt.accessTtlSeconds');
  }

  get refreshTtlDays(): number {
    return this.configService.getOrThrow('jwt.refreshTtlDays');
  }

  get refreshTtlSeconds(): number {
    return this.configService.getOrThrow('jwt.refreshTtlSeconds');
  }
}
