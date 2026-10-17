import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = dirname(fileURLToPath(new URL('.', import.meta.url)));
const srcRoot = join(backendRoot, 'src');
const hits = [];

for (const file of walk(srcRoot)) {
  const source = readFileSync(file, 'utf8');
  const top = topLevel(blankNonCode(source));
  if (!hasClass(top)) continue;
  for (const found of functionsIn(top)) {
    const path = relative(backendRoot, file);
    hits.push(`${path}:${lineOf(source, found.index)} ${found.name}`);
  }
}

if (hits.length > 0) {
  process.stdout.write(`${hits.join('\n')}\n`);
  process.exit(1);
}

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) files.push(path);
  }
  return files;
}

function blankNonCode(source) {
  let out = '';
  let i = 0;
  while (i < source.length) {
    const step = blankAt(source, i);
    out += step.text;
    i += step.size;
  }
  return out;
}

function blankAt(source, i) {
  if (source.startsWith('//', i)) return blankUntil(source, i, '\n');
  if (source.startsWith('/*', i)) return blankUntil(source, i, '*/');
  if (source[i] === "'" || source[i] === '"') return blankString(source, i, source[i]);
  if (source[i] === '`') return blankTemplate(source, i);
  return { text: source[i], size: 1 };
}

function blankUntil(source, i, end) {
  const close = source.indexOf(end, i + end.length);
  const stop = close === -1 ? source.length : close + end.length;
  return { text: spaces(source.slice(i, stop)), size: stop - i };
}

function blankString(source, i, quote) {
  let j = i + 1;
  while (j < source.length && source[j] !== '\n') {
    if (source[j] === '\\') {
      j += 2;
      continue;
    }
    if (source[j] === quote) return { text: spaces(source.slice(i, j + 1)), size: j + 1 - i };
    j += 1;
  }
  return { text: spaces(source.slice(i, j)), size: j - i };
}

function blankTemplate(source, i) {
  let out = ' ';
  let j = i + 1;
  while (j < source.length) {
    if (source[j] === '\\') {
      out += spaces(source.slice(j, j + 2));
      j += 2;
      continue;
    }
    if (source.startsWith('${', j)) {
      const inner = templateExpr(source, j + 2);
      out += '${' + inner.text;
      j += 2 + inner.size;
      continue;
    }
    if (source[j] === '`') return { text: out + ' ', size: j + 1 - i };
    out += source[j] === '\n' ? '\n' : ' ';
    j += 1;
  }
  return { text: out, size: j - i };
}

function templateExpr(source, i) {
  let depth = 1;
  let out = '';
  let j = i;
  while (j < source.length && depth > 0) {
    if (source[j] === '{') depth += 1;
    if (source[j] === '}') depth -= 1;
    if (depth === 0) return { text: `${out}}`, size: j + 1 - i };
    const step = blankAt(source, j);
    out += step.text;
    j += step.size;
  }
  return { text: out, size: j - i };
}

function spaces(text) {
  return text.replace(/[^\n]/g, ' ');
}

function topLevel(source) {
  let out = '';
  let depth = 0;
  for (const char of source) {
    if (char === '{') depth += 1;
    if (char === '}') depth = Math.max(0, depth - 1);
    out += depth === 0 || char === '\n' ? char : ' ';
  }
  return out;
}

function hasClass(top) {
  return /(?:^|[\n;])\s*(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+/.test(top);
}

function functionsIn(top) {
  return [...named(top, functionPattern()), ...arrowConsts(top)];
}

function functionPattern() {
  return /(?:^|[\n;])\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g;
}

function named(top, pattern) {
  const found = [];
  for (const match of top.matchAll(pattern)) {
    found.push({ name: match[1], index: match.index + match[0].lastIndexOf(match[1]) });
  }
  return found;
}

function arrowConsts(top) {
  const found = [];
  const pattern = /(?:^|[\n;])\s*(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*/g;
  for (const match of top.matchAll(pattern)) {
    const after = match.index + match[0].length;
    if (!isArrow(top.slice(after))) continue;
    found.push({ name: match[1], index: match.index + match[0].lastIndexOf(match[1]) });
  }
  return found;
}

function isArrow(rest) {
  let i = skipSpace(rest, 0);
  if (rest.startsWith('async', i) && /[\s<(]/.test(rest[i + 5] ?? '')) i = skipSpace(rest, i + 5);
  if (rest[i] === '<') {
    const end = skipBracket(rest, i, '<', '>');
    if (end < 0) return false;
    i = skipSpace(rest, end);
  }
  if (rest[i] === '(') {
    const end = skipBracket(rest, i, '(', ')');
    if (end < 0) return false;
    i = end;
  } else if (isIdentStart(rest[i])) {
    i += 1;
    while (isIdentPart(rest[i])) i += 1;
  } else {
    return false;
  }
  i = skipSpace(rest, i);
  if (rest[i] === ':') i = skipType(rest, i + 1);
  return rest.startsWith('=>', i);
}

function skipType(rest, i) {
  let depth = 0;
  while (i < rest.length) {
    const char = rest[i];
    if (char === '(' || char === '[' || char === '{' || char === '<') depth += 1;
    if (char === ')' || char === ']' || char === '}' || char === '>') depth = Math.max(0, depth - 1);
    if (depth === 0 && rest.startsWith('=>', i)) return i;
    if (depth === 0 && (char === ';' || char === '\n')) return i;
    i += 1;
  }
  return i;
}

function skipBracket(rest, i, open, close) {
  let depth = 0;
  for (let j = i; j < rest.length; j += 1) {
    if (rest[j] === open) depth += 1;
    if (rest[j] === close) depth -= 1;
    if (depth === 0) return j + 1;
  }
  return -1;
}

function skipSpace(text, i) {
  while (/\s/.test(text[i] ?? '')) i += 1;
  return i;
}

function isIdentStart(char) {
  return /[A-Za-z_$]/.test(char ?? '');
}

function isIdentPart(char) {
  return /[\w$]/.test(char ?? '');
}

function lineOf(source, index) {
  let line = 1;
  for (let i = 0; i < index && i < source.length; i += 1) {
    if (source[i] === '\n') line += 1;
  }
  return line;
}
