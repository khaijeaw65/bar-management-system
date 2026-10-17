import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { LineConfigService } from '../../../../providers/config/line/config.service.js';
import {
  buildLineAuthorizeUrl,
  type LineClient,
} from '../../domain/line-client.js';
import type {
  LineAuthorizeInput,
  LineProfile,
  LineTokenExchange,
} from '../../domain/line-client.types.js';

const TokenResponseSchema = z.object({
  id_token: z.string().min(1),
});

const VerifyResponseSchema = z.object({
  sub: z.string().min(1),
  name: z.string().optional(),
  picture: z.string().optional(),
  nonce: z.string().optional(),
});

@Injectable()
export class LineClientHttp implements LineClient {
  public constructor(private readonly lineConfigService: LineConfigService) {}

  public authorizeUrl(input: LineAuthorizeInput): string {
    return buildLineAuthorizeUrl({
      channelId: this.lineConfigService.channelId,
      callbackUrl: this.lineConfigService.callbackUrl,
      state: input.state,
      nonce: input.nonce,
    });
  }

  public async exchangeCode(code: string): Promise<LineTokenExchange> {
    const body = await this.postForm(
      'https://api.line.me/oauth2/v2.1/token',
      {
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.lineConfigService.callbackUrl,
        client_id: this.lineConfigService.channelId,
        client_secret: this.lineConfigService.channelSecret,
      },
      'LINE token exchange failed',
    );
    return this.readIdToken(body);
  }

  public async verifyIdToken(
    idToken: string,
    nonce: string,
  ): Promise<LineProfile> {
    const body = await this.postForm(
      'https://api.line.me/oauth2/v2.1/verify',
      {
        id_token: idToken,
        client_id: this.lineConfigService.channelId,
        nonce,
      },
      'LINE ID token verification failed',
    );
    return this.readLineProfile(body, nonce);
  }

  private async postForm(
    url: string,
    fields: Record<string, string>,
    failure: string,
  ): Promise<unknown> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields),
    });
    if (!response.ok) throw new Error(failure);
    return response.json() as Promise<unknown>;
  }

  private readIdToken(body: unknown): LineTokenExchange {
    const parsed = TokenResponseSchema.safeParse(body);
    if (!parsed.success) throw new Error('LINE token exchange failed');
    return { idToken: parsed.data.id_token };
  }

  private readLineProfile(body: unknown, nonce: string): LineProfile {
    const parsed = VerifyResponseSchema.safeParse(body);
    if (!parsed.success || this.nonceMismatch(parsed.data.nonce, nonce)) {
      throw new Error('LINE ID token verification failed');
    }
    return {
      sub: parsed.data.sub,
      name: parsed.data.name ?? null,
      picture: parsed.data.picture ?? null,
    };
  }

  private nonceMismatch(tokenNonce: string | undefined, nonce: string): boolean {
    return tokenNonce !== undefined && tokenNonce !== nonce;
  }
}
