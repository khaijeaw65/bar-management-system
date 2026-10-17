import { Injectable } from '@nestjs/common';
import type { Order } from '@bar/contracts';
import { DomainException } from '../../../common/domain-exception.js';
import { RedisService } from '../../../providers/redis/redis.service.js';

const DAY_SECONDS = 24 * 60 * 60;
const PENDING_SECONDS = 60;

export type IdempotencyGate =
  | { kind: 'skip' }
  | { kind: 'owned' }
  | { kind: 'replay'; order: Order };

interface Stored {
  hash: string;
  order: Order | null;
}

@Injectable()
export class IdempotencyService {
  public constructor(private readonly redis: RedisService) {}

  public async begin(key: string | null, hash: string): Promise<IdempotencyGate> {
    if (!key) return { kind: 'skip' };
    const existing = await this.read(key);
    if (existing) return this.fromStored(key, hash, existing);
    return this.claim(key, hash);
  }

  public async finish(key: string | null, hash: string, order: Order): Promise<void> {
    if (!key) return;
    const body = JSON.stringify({ hash, order } satisfies Stored);
    await this.redis.client.set(this.redisKey(key), body, 'EX', DAY_SECONDS);
  }

  public async cancel(key: string | null): Promise<void> {
    if (!key) return;
    const existing = await this.read(key);
    if (existing?.order) return;
    await this.redis.client.del(this.redisKey(key));
  }

  private async claim(key: string, hash: string): Promise<IdempotencyGate> {
    const owned = await this.redis.client.set(
      this.redisKey(key),
      JSON.stringify({ hash, order: null } satisfies Stored),
      'EX',
      PENDING_SECONDS,
      'NX',
    );
    if (owned === 'OK') return { kind: 'owned' };
    const existing = await this.read(key);
    if (!existing) return { kind: 'owned' };
    return this.fromStored(key, hash, existing);
  }

  private async fromStored(key: string, hash: string, existing: Stored): Promise<IdempotencyGate> {
    if (existing.hash !== hash) throw this.reused();
    if (existing.order) return { kind: 'replay', order: existing.order };
    return { kind: 'replay', order: await this.poll(key, hash) };
  }

  private async poll(key: string, hash: string): Promise<Order> {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await this.delay(50);
      const existing = await this.read(key);
      if (!existing || existing.hash !== hash) throw this.reused();
      if (existing.order) return existing.order;
    }
    throw this.inFlight();
  }

  private async read(key: string): Promise<Stored | null> {
    const raw = await this.redis.client.get(this.redisKey(key));
    if (!raw) return null;
    return JSON.parse(raw) as Stored;
  }

  private redisKey(key: string): string {
    return `idempotency:order:${key}`;
  }

  private reused(): DomainException {
    return new DomainException('IDEMPOTENCY_KEY_REUSED', 'ใช้คีย์นี้กับคำขออื่นแล้ว', 409);
  }

  private inFlight(): DomainException {
    return new DomainException('CONFLICT', 'คำสั่งนี้กำลังดำเนินการ ลองอีกครั้ง', 409);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
