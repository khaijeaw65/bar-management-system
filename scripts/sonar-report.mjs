import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_KEY = 'bar-management';
const SEVERITIES = ['BLOCKER', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

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
  const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
  const gate = await getJson(
    `/api/qualitygates/project_status?projectKey=${PROJECT_KEY}`,
  );
  const counts = await issueCounts();
  const top = await topIssues();
  process.stdout.write(render(commit, gate, counts, top));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message.split(token).join('[redacted]'));
  process.exit(1);
}

async function issueCounts() {
  const body = await getJson(
    `/api/issues/search?projects=${PROJECT_KEY}&resolved=false&facets=impactSeverities&ps=1`,
  );
  const facet = (body.facets ?? []).find((item) => item.property === 'impactSeverities');
  const counts = Object.fromEntries(SEVERITIES.map((severity) => [severity, 0]));
  for (const value of facet?.values ?? []) {
    if (value.val in counts) counts[value.val] = value.count;
  }
  return counts;
}

async function topIssues() {
  const issues = [];
  for (const severity of SEVERITIES) {
    if (issues.length >= 10) break;
    const body = await getJson(
      `/api/issues/search?projects=${PROJECT_KEY}&resolved=false&impactSeverities=${severity}&ps=${10 - issues.length}`,
    );
    issues.push(...(body.issues ?? []));
  }
  return issues.slice(0, 10);
}

function render(commit, gate, counts, issues) {
  const status = gate.projectStatus;
  const failed = (status?.conditions ?? []).filter((condition) => condition.status !== 'OK');
  const lines = [
    `- Scanned commit: \`${commit}\``,
    `- Quality Gate: ${status?.status ?? 'UNKNOWN'}`,
    failed.length === 0
      ? '- Failed conditions: none'
      : `- Failed conditions:\n${failed.map(formatCondition).join('\n')}`,
    `- Issues by severity: ${SEVERITIES.map((severity) => `${severity} ${counts[severity]}`).join(' · ')}`,
    '',
    '### Top 10 open issues',
  ];
  if (issues.length === 0) {
    lines.push('- none');
  } else {
    issues.forEach((issue, index) => {
      lines.push(
        `${index + 1}. \`${issue.rule}\` \`${location(issue)}\` — ${issue.message}`,
      );
    });
  }
  return `${lines.join('\n')}\n`;
}

function formatCondition(condition) {
  return `- \`${condition.metricKey}\` ${condition.comparator} ${condition.errorThreshold} (actual ${condition.actualValue}) — ${condition.status}`;
}

function location(issue) {
  const file = String(issue.component ?? '').replace(`${PROJECT_KEY}:`, '');
  return issue.line ? `${file}:${issue.line}` : file;
}

async function getJson(path) {
  const response = await fetch(`${serverUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`SonarQube ${path} returned ${response.status}: ${text.slice(0, 300)}`);
  }
  return JSON.parse(text);
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
