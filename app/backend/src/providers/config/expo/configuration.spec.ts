import { expoConfiguration } from './configuration.js';

describe('expoConfiguration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('treats a blank EXPO_ACCESS_TOKEN as unset', () => {
    vi.stubEnv('EXPO_ACCESS_TOKEN', '');

    expect(expoConfiguration()).toEqual({ accessToken: undefined });
  });

  it('returns the access token when set', () => {
    vi.stubEnv('EXPO_ACCESS_TOKEN', 'secret');

    expect(expoConfiguration()).toEqual({ accessToken: 'secret' });
  });
});
