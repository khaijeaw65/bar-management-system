import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseConfigService {
  public constructor(private readonly configService: ConfigService) {}

  public get host(): string {
    return this.configService.getOrThrow('database.host');
  }

  public get port(): number {
    return this.configService.getOrThrow('database.port');
  }

  public get username(): string {
    return this.configService.getOrThrow('database.username');
  }

  public get password(): string {
    return this.configService.getOrThrow('database.password');
  }

  public get database(): string {
    return this.configService.getOrThrow('database.database');
  }
}
