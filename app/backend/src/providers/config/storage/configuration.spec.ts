import storageConfiguration from './configuration.js';

const KEYS = ['AWS_REGION', 'S3_BUCKET', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'] as const;

function withEnv(values: Partial<Record<(typeof KEYS)[number], string>>, run: () => void): void {
  const saved = KEYS.map((key) => [key, process.env[key]] as const);
  for (const key of KEYS) delete process.env[key];
  Object.assign(process.env, values);
  try {
    run();
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

describe('storage config', () => {
  it('reads region and bucket; the access keys are optional', () => {
    withEnv({ AWS_REGION: 'ap-southeast-1', S3_BUCKET: 'bar-app-dev', AWS_ACCESS_KEY_ID: '' }, () => {
      expect(storageConfiguration()).toEqual({
        region: 'ap-southeast-1',
        bucket: 'bar-app-dev',
        accessKeyId: undefined,
        secretAccessKey: undefined,
      });
    });
  });

  it('fails at boot naming the missing variable, without echoing any value', () => {
    withEnv({ AWS_REGION: 'ap-southeast-1', AWS_SECRET_ACCESS_KEY: 'super-secret-value' }, () => {
      let message = '';
      try {
        storageConfiguration();
      } catch (error) {
        message = (error as Error).message;
      }
      expect(message).toMatch(/Validate storage config error[\s\S]*S3_BUCKET/);
      expect(message).not.toContain('super-secret-value');
    });
  });
});
