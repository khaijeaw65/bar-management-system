export type LoginResult =
  | {
      kind: 'session';
      location: string;
      accessToken: string;
      refreshToken: string;
    }
  | { kind: 'redirect'; location: string };

export type RefreshResult =
  | { kind: 'ok'; accessToken: string; refreshToken: string }
  | { kind: 'unauthorized' };

export type LineLoginCallbackInput = {
  code?: string;
  state?: string;
  error?: string;
};
