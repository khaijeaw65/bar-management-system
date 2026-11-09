#!/usr/bin/env node
// field-kit: one class per file, and that file holds only the class —
// no module-level functions / function consts, no type / interface declarations.
// Uses the TypeScript parser (no regex tricks). Run from the backend package:
//   node scripts/check-class-files.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';

const ts = createRequire(join(process.cwd(), 'package.json'))('typescript');
const root = join(process.cwd(), process.argv[2] ?? 'src');
const EXEMPT = /(\.(spec|e2e-spec|types|port|dto|openapi|errors)\.ts|\.d\.ts)$/;
const SKIP_DIRS = new Set(['node_modules', 'dist', 'migrations']);
const hits = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(path);
    } else if (entry.name.endsWith('.ts') && !EXEMPT.test(entry.name)) {
      check(path);
    }
  }
}

function check(file) {
  const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const classes = sf.statements.filter(ts.isClassDeclaration);
  if (classes.length === 0) return;
  const at = (node) =>
    `${relative(process.cwd(), file)}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1}`;
  for (const extra of classes.slice(1)) {
    hits.push(`${at(extra)} second class ${extra.name?.text ?? '<anonymous>'} in one file → own file (errors → <name>.errors.ts)`);
  }
  for (const st of sf.statements) {
    if (ts.isFunctionDeclaration(st)) {
      hits.push(`${at(st)} function ${st.name?.text ?? '<anonymous>'} in a class file → private method`);
    } else if (ts.isInterfaceDeclaration(st) || ts.isTypeAliasDeclaration(st)) {
      hits.push(`${at(st)} type ${st.name.text} in a class file → <name>.types.ts`);
    } else if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) {
        const init = d.initializer;
        if (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) {
          hits.push(`${at(st)} function const ${d.name.getText(sf)} in a class file → private method`);
        }
      }
    }
  }
}

walk(root);
if (hits.length) {
  console.error(hits.join('\n'));
  console.error(`\n${hits.length} class-file violation(s)`);
  process.exit(1);
}
console.log('class files OK');
