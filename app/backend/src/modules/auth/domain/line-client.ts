export interface LineProfile {
  sub: string;
  name: string | null;
  picture: string | null;
}

export type LineAuthorizeInput = {
  state: string;
  nonce: string;
};

export type LineTokenExchange = {
  idToken: string;
};

export type LineAuthorizeUrlInput = {
  channelId: string;
  callbackUrl: string;
  state: string;
  nonce: string;
};

export interface LineClient {
  authorizeUrl(input: LineAuthorizeInput): string;
  exchangeCode(code: string): Promise<LineTokenExchange>;
  verifyIdToken(idToken: string, nonce: string): Promise<LineProfile>;
}

export const LINE_CLIENT = Symbol('LINE_CLIENT');

export function buildLineAuthorizeUrl(input: LineAuthorizeUrlInput): string {
  const url = new URL('https://access.line.me/oauth2/v2.1/authorize');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', input.channelId);
  url.searchParams.set('redirect_uri', input.callbackUrl);
  url.searchParams.set('state', input.state);
  url.searchParams.set('nonce', input.nonce);
  url.searchParams.set('scope', 'profile openid');
  return url.toString();
}
