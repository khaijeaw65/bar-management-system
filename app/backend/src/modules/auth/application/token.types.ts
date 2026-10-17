export interface AccessClaims {
  sub?: unknown;
  sid?: unknown;
}

export interface RefreshRecord {
  userId: string;
  familyId: string;
}

export type IssuedSession = {
  accessToken: string;
  refreshToken: string;
  familyId: string;
};

export type RotateResult =
  | { status: 'ok'; accessToken: string; refreshToken: string }
  | { status: 'invalid' }
  | { status: 'reused' };

export type RotationOutcome =
  | { kind: 'ok'; userId: string; familyId: string }
  | { kind: 'reused' }
  | { kind: 'invalid' };
