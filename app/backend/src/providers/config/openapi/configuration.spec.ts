import { openApiConfiguration } from './configuration.js';

describe('openApiConfiguration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults OPENAPI_ENABLED to true', () => {
    vi.stubEnv('OPENAPI_ENABLED', '');
    expect(openApiConfiguration()).toEqual({ enabled: true });
  });

  it('accepts false', () => {
    vi.stubEnv('OPENAPI_ENABLED', 'false');
    expect(openApiConfiguration()).toEqual({ enabled: false });
  });

  it('names OPENAPI_ENABLED when the value is not a boolean', () => {
    vi.stubEnv('OPENAPI_ENABLED', 'yes');
    expect(() => openApiConfiguration()).toThrow(/OPENAPI_ENABLED/);
  });
});
