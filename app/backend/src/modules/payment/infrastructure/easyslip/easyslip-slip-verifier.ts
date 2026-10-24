import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { money } from '../../../../common/money.js';
import { EasySlipConfigService } from '../../../../providers/config/easyslip/config.service.js';
import type {
  ReceiverMatch,
  SlipCheck,
  SlipVerifier,
  SlipVerifyContext,
  SlipVerifyResult,
} from '../../domain/ports/slip-verifier.port.js';

const SuccessSchema = z.object({
  success: z.literal(true),
  data: z.object({
    matchedAccount: z.unknown().optional(),
    amountInSlip: z.number().finite(),
    rawSlip: z.object({
      transRef: z.string().min(1).max(100),
    }),
  }),
});

const FailureSchema = z.object({
  success: z.literal(false),
  error: z.object({ code: z.string() }),
});

@Injectable()
export class EasySlipSlipVerifier implements SlipVerifier {
  public constructor(private readonly config: EasySlipConfigService) {}

  public async verify(input: SlipCheck, context: SlipVerifyContext): Promise<SlipVerifyResult> {
    const key = this.config.apiKey;
    if (key.length === 0) return { kind: 'unavailable' };
    try {
      const response = await fetch(this.endpoint(), {
        method: 'POST',
        headers: {
          authorization: `Bearer ${key}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(this.requestBody(input, context.expectedAmount)),
        signal: AbortSignal.timeout(10_000),
      });
      return await this.read(response);
    } catch {
      return { kind: 'unavailable' };
    }
  }

  private endpoint(): string {
    return `${this.config.baseUrl.replace(/\/$/, '')}/verify/bank`;
  }

  private requestBody(input: SlipCheck, expectedAmount: string): Record<string, unknown> {
    const slip = 'payload' in input ? { payload: input.payload } : { base64: input.image };
    return {
      ...slip,
      matchAccount: true,
      matchAmount: Number(expectedAmount),
      checkDuplicate: false,
    };
  }

  private async read(response: Response): Promise<SlipVerifyResult> {
    if (this.down(response.status)) return { kind: 'unavailable' };
    const json: unknown = await response.json().catch(() => null);
    return this.mapBody(json);
  }

  private down(status: number): boolean {
    return status === 401 || status === 403 || status === 429 || status >= 500;
  }

  private mapBody(json: unknown): SlipVerifyResult {
    const failure = FailureSchema.safeParse(json);
    if (failure.success) return this.failure(failure.data.error.code);
    const success = SuccessSchema.safeParse(json);
    if (!success.success) return { kind: 'unavailable' };
    return {
      kind: 'verified',
      transRef: success.data.data.rawSlip.transRef,
      amount: money(success.data.data.amountInSlip),
      receiverMatch: this.receiver(success.data.data.matchedAccount),
    };
  }

  private failure(code: string): SlipVerifyResult {
    if (code === 'SLIP_NOT_FOUND') return { kind: 'invalid' };
    if (code === 'SLIP_PENDING') return { kind: 'pending' };
    return { kind: 'unavailable' };
  }

  /** AC-7: a missing or null matchedAccount is unclear, not a proven mismatch. */
  private receiver(value: unknown): ReceiverMatch {
    if (value !== null && value !== undefined && typeof value === 'object') return 'matched';
    return 'unknown';
  }
}
