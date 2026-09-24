import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from '../orm/snake-naming.strategy.js';
import { type Env } from './config.schema.js';

export function databaseOptions(env: Env) {
  return {
    type: 'postgres' as const,
    host: env.PGHOST,
    port: env.PGPORT,
    username: env.PGUSER,
    password: env.PGPASSWORD,
    database: env.PGDATABASE,
    synchronize: false as const,
    migrationsRun: false as const,
    namingStrategy: new SnakeNamingStrategy(),
    ssl:
      env.NODE_ENV === 'local' || env.NODE_ENV === 'test'
        ? (false as const)
        : { rejectUnauthorized: false as const },
  };
}

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  get app() {
    return {
      nodeEnv: this.readEnv().NODE_ENV,
      port: this.readEnv().PORT,
    };
  }

  get database() {
    return databaseOptions(this.readEnv());
  }

  private readEnv(): Env {
    return {
      NODE_ENV: this.config.getOrThrow<Env['NODE_ENV']>('NODE_ENV'),
      PORT: this.config.getOrThrow<number>('PORT'),
      PGHOST: this.config.getOrThrow<string>('PGHOST'),
      PGPORT: this.config.getOrThrow<number>('PGPORT'),
      PGUSER: this.config.getOrThrow<string>('PGUSER'),
      PGPASSWORD: this.config.getOrThrow<string>('PGPASSWORD'),
      PGDATABASE: this.config.getOrThrow<string>('PGDATABASE'),
    };
  }
}
