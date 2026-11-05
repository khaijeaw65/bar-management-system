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

export type LineLoginStart = {
  client?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
};

export type OauthState = {
  nonce: string;
  client?: 'mobile';
  codeChallenge?: string;
};

export type MobileCodeRecord = {
  userId: string;
  codeChallenge: string;
};

export type IssuedMobileTokens = {
  accessToken: string;
  refreshToken: string;
};

export type MobileTokenResult =
  | ({ kind: 'ok' } & IssuedMobileTokens)
  | { kind: 'unauthorized' };

export type MobileAuthError = 'login_failed' | 'not_registered';

export type DemoRoleTarget = {
  lineUserId: string;
  displayName: string;
  groupId: string;
};

export type DemoLoginResult = {
  accessToken: string;
  refreshToken: string;
};
