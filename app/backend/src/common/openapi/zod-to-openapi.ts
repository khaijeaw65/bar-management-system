import { z } from 'zod';

export function zodToOpenApi(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema, { target: 'openapi-3.0' });
  return stripSchemaKeyword(json) as Record<string, unknown>;
}

function stripSchemaKeyword(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripSchemaKeyword);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => key !== '$schema')
        .map(([key, inner]) => [key, stripSchemaKeyword(inner)]),
    );
  }
  return value;
}
