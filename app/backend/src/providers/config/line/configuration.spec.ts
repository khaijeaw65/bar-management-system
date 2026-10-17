import { lineConfiguration } from './configuration.js';

describe('lineConfiguration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(['LINE_CHANNEL_ID', 'LINE_CHANNEL_SECRET', 'LINE_CALLBACK_URL'])(
    'names %s when it is missing',
    (name) => {
      vi.stubEnv('LINE_CHANNEL_ID', 'channel');
      vi.stubEnv('LINE_CHANNEL_SECRET', 'secret');
      vi.stubEnv('LINE_CALLBACK_URL', 'http://localhost:3001/api/auth/line/callback');
      vi.stubEnv(name, '');

      expect(() => lineConfiguration()).toThrow(new RegExp(name));
    },
  );
});
