import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseConfigService {
  constructor(private readonly configService: ConfigService) {}

  get host(): string {
    return this.configService.getOrThrow('database.host');
  }

  get port(): number {
    return this.configService.getOrThrow('database.port');
  }

  get username(): string {
    return this.configService.getOrThrow('database.username');
  }

  get password(): string {
    return this.configService.getOrThrow('database.password');
  }

  get database(): string {
    return this.configService.getOrThrow('database.database');
  }
}
