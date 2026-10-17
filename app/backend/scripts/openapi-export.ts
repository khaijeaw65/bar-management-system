import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createOpenApiDocument,
  stableJson,
} from '../dist/common/openapi/document.js';

// Builds the spec from documented controllers with infra stubbed (see
// createOpenApiDocument). No database or Redis connection.
const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, '../../../docs/api/openapi.json');
const document = await createOpenApiDocument();
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, stableJson(document));
