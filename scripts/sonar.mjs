import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { scan } from '@sonar/scan';

loadRootEnv();

const token = process.env.SONAR_TOKEN?.trim();
if (!token) {
  console.error(
    'SONAR_TOKEN is missing. Add SONAR_TOKEN to the repo-root .env (see docs/quality/README.md).',
  );
  process.exit(1);
}

const serverUrl = (process.env.SONAR_HOST_URL?.trim() || 'http://localhost:9000').replace(
  /\/$/,
  '',
);

try {
  await scan({
    serverUrl,
    token,
    options: {
      'sonar.qualitygate.wait': 'true',
    },
  });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message.split(token).join('[redacted]'));
  process.exit(1);
}

function loadRootEnv() {
  const path = resolve(process.cwd(), '.env');
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch (error) {
    if (error && error.code === 'ENOENT') return;
    throw error;
  }
  for (const rawLine of text.split('\n')) {
    const parsed = parseEnvLine(rawLine);
    if (parsed) process.env[parsed.key] = parsed.value;
  }
}

function parseEnvLine(rawLine) {
  const line = rawLine.trim();
  if (!line || line.startsWith('#')) return null;
  const eq = line.indexOf('=');
  if (eq <= 0) return null;
  const key = line.slice(0, eq).trim().replace(/^export\s+/, '');
  let value = line.slice(eq + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return { key, value };
}
