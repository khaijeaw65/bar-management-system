import { Injectable } from '@nestjs/common';
import { DomainException } from '../domain-exception.js';
import { RedisService } from '../../providers/redis/redis.service.js';
import type {
  IdempotencyBegin,
  IdempotencyFinish,
  IdempotencyGate,
  StoredIdempotency,
} from './idempotency.types.js';

const DAY_SECONDS = 24 * 60 * 60;
const PENDING_SECONDS = 60;

@Injectable()
export class IdempotencyService {
  public constructor(private readonly redis: RedisService) {}

  public async begin<T>(input: IdempotencyBegin): Promise<IdempotencyGate<T>> {
    if (!input.key) return { kind: 'skip' };
    const existing = await this.read<T>(input.scope, input.key);
    if (existing) return this.fromStored(input, existing);
    return this.claim<T>(input);
  }

  public async finish<T>(input: IdempotencyFinish<T>): Promise<void> {
    if (!input.key) return;
    const stored = JSON.stringify({ hash: input.hash, body: input.body } satisfies StoredIdempotency<T>);
    await this.redis.client.set(this.redisKey(input.scope, input.key), stored, 'EX', DAY_SECONDS);
  }

  public async cancel(scope: string, key: string | null): Promise<void> {
    if (!key) return;
    const existing = await this.read(scope, key);
    if (existing?.body) return;
    await this.redis.client.del(this.redisKey(scope, key));
  }

  private async claim<T>(input: IdempotencyBegin): Promise<IdempotencyGate<T>> {
    if (!input.key) return { kind: 'skip' };
    const owned = await this.redis.client.set(
      this.redisKey(input.scope, input.key),
      JSON.stringify({ hash: input.hash, body: null } satisfies StoredIdempotency<T>),
      'EX',
      PENDING_SECONDS,
      'NX',
    );
    if (owned === 'OK') return { kind: 'owned' };
    const existing = await this.read<T>(input.scope, input.key);
    if (!existing) return { kind: 'owned' };
    return this.fromStored(input, existing);
  }

  private async fromStored<T>(
    input: IdempotencyBegin,
    existing: StoredIdempotency<T>,
  ): Promise<IdempotencyGate<T>> {
    if (existing.hash !== input.hash) throw this.reused();
    if (existing.body) return { kind: 'replay', body: existing.body };
    return { kind: 'replay', body: await this.poll<T>(input) };
  }

  private async poll<T>(input: IdempotencyBegin): Promise<T> {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await this.delay(50);
      const existing = await this.readAttempt<T>(input);
      if (existing?.body) return existing.body;
    }
    throw this.stillRunning();
  }

  private async readAttempt<T>(input: IdempotencyBegin): Promise<StoredIdempotency<T> | null> {
    if (!input.key) throw this.inProgress();
    const existing = await this.read<T>(input.scope, input.key);
    if (!existing) throw this.inProgress();
    if (existing.hash !== input.hash) throw this.reused();
    return existing;
  }

  private async read<T>(scope: string, key: string): Promise<StoredIdempotency<T> | null> {
    const raw = await this.redis.client.get(this.redisKey(scope, key));
    if (!raw) return null;
    return JSON.parse(raw) as StoredIdempotency<T>;
  }

  private redisKey(scope: string, key: string): string {
    return `idempotency:${scope}:${key}`;
  }

  private reused(): DomainException {
    return new DomainException('IDEMPOTENCY_KEY_REUSED', 'ใช้คีย์นี้กับคำขออื่นแล้ว', 409);
  }

  private inProgress(): DomainException {
    return new DomainException('CONFLICT', 'กำลังดำเนินการ', 409);
  }

  private stillRunning(): DomainException {
    return new DomainException('CONFLICT', 'คำสั่งนี้กำลังดำเนินการ ลองอีกครั้ง', 409);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
