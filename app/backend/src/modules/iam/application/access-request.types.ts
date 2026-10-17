import type { IdentityProvider } from '@bar/contracts';

export type AccessRequestInput = {
  provider: IdentityProvider;
  externalId: string;
  displayName: string | null;
  avatarUrl: string | null;
};
