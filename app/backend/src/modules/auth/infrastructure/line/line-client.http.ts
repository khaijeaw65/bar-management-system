import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { LineConfigService } from '../../../../providers/config/line/config.service.js';
import {
  buildLineAuthorizeUrl,
  type LineClient,
  type LineProfile,
} from '../../domain/line-client.js';

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
  constructor(private readonly config: LineConfigService) {}

  authorizeUrl(input: { state: string; nonce: string }): string {
    return buildLineAuthorizeUrl({
      channelId: this.config.channelId,
      callbackUrl: this.config.callbackUrl,
      state: input.state,
      nonce: input.nonce,
    });
  }

  async exchangeCode(code: string): Promise<{ idToken: string }> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.callbackUrl,
      client_id: this.config.channelId,
      client_secret: this.config.channelSecret,
    });
    const response = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!response.ok) {
      throw new Error('LINE token exchange failed');
    }
    const parsed = TokenResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      throw new Error('LINE token exchange failed');
    }
    return { idToken: parsed.data.id_token };
  }

  async verifyIdToken(idToken: string, nonce: string): Promise<LineProfile> {
    const body = new URLSearchParams({
      id_token: idToken,
      client_id: this.config.channelId,
      nonce,
    });
    const response = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!response.ok) {
      throw new Error('LINE ID token verification failed');
    }
    const parsed = VerifyResponseSchema.safeParse(await response.json());
    if (!parsed.success || (parsed.data.nonce !== undefined && parsed.data.nonce !== nonce)) {
      throw new Error('LINE ID token verification failed');
    }
    return {
      sub: parsed.data.sub,
      name: parsed.data.name ?? null,
      picture: parsed.data.picture ?? null,
    };
  }
}
