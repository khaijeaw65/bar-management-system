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
