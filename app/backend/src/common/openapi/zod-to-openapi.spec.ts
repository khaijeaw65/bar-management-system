import { MoneySchema } from '@bar/contracts';
import { z } from 'zod';
import { zodToOpenApi } from './zod-to-openapi.js';

const SampleSchema = z.object({
  label: z.string(),
  status: z.enum(['pending', 'closed']),
  note: z.string().nullable(),
  tags: z.array(z.string()),
  price: MoneySchema,
  nested: z.object({ qty: z.number().int() }),
});

describe('zodToOpenApi', () => {
  const schema = zodToOpenApi(SampleSchema);
  const properties = schema.properties as Record<string, Record<string, unknown>>;

  it('describes a nested object, enum, nullable, array, and money string', () => {
    expect(schema.type).toBe('object');
    expect(schema.$schema).toBeUndefined();
    expect(properties.label).toMatchObject({ type: 'string' });
    expect(properties.status).toMatchObject({
      type: 'string',
      enum: ['pending', 'closed'],
    });
    expect(properties.note).toMatchObject({ type: 'string', nullable: true });
    expect(properties.tags).toMatchObject({
      type: 'array',
      items: { type: 'string' },
    });
    expect(properties.price).toMatchObject({
      type: 'string',
      pattern: String.raw`^\d+\.\d{2}$`,
    });
    expect(properties.nested).toMatchObject({
      type: 'object',
      properties: { qty: { type: 'integer' } },
    });
  });
});
