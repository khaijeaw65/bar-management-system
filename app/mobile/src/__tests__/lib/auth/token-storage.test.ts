import { saveTokens, readTokens, clearTokens } from '../../../lib/auth/token-storage';

describe('Token Storage (AC-2, AC-8, AC-10)', () => {
  beforeEach(async () => {
    await clearTokens();
  });

  it('saves and reads tokens from SecureStore', async () => {
    expect(await readTokens()).toBeNull();

    await saveTokens({
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
    });

    const tokens = await readTokens();
    expect(tokens).toEqual({
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
    });
  });

  it('returns null if either token is missing', async () => {
    await saveTokens({
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
    });

    await clearTokens();
    expect(await readTokens()).toBeNull();
  });

  it('clears all tokens', async () => {
    await saveTokens({
      accessToken: 'access-abc',
      refreshToken: 'refresh-xyz',
    });

    await clearTokens();
    expect(await readTokens()).toBeNull();
  });
});
