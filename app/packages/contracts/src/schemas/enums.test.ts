import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { schemaEnumBySqlName } from './enums.js';

function sqlEnums(source: string): Record<string, string[]> {
  const found: Record<string, string[]> = {};
  for (const match of source.matchAll(
    /CREATE TYPE\s+(\w+)\s+AS ENUM\s+\(([^)]*)\)/g,
  )) {
    const name = match[1];
    const body = match[2];
    if (!name || body === undefined) continue;
    found[name] = [...body.matchAll(/'([^']*)'/g)].map((value) => value[1] ?? '');
  }
  return found;
}

describe('schema enums', () => {
  const source = readFileSync(
    resolve(
      dirname(fileURLToPath(import.meta.url)),
      '../../../../../docs/schema.sql',
    ),
    'utf8',
  );
  const declared = sqlEnums(source);

  it('matches every CREATE TYPE in docs/schema.sql', () => {
    expect(Object.keys(schemaEnumBySqlName).sort()).toEqual(
      Object.keys(declared).sort(),
    );

    for (const [name, values] of Object.entries(declared)) {
      const schema = schemaEnumBySqlName[name as keyof typeof schemaEnumBySqlName];
      expect(schema.options).toEqual(values);
    }
  });
});
