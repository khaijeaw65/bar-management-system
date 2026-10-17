import { z } from 'zod';
import { ErrorCodeSchema } from './errors.js';

export const UuidSchema = z.uuid();

// NUMERIC(..., 2) on the wire. DR-004.
export const MoneySchema = z.string().regex(/^\d+\.\d{2}$/);

// ISO 8601 with an offset. UTC `Z` counts. docs/api/README.md.
export const IsoDateTimeSchema = z.iso.datetime({ offset: true });

export function apiResponseSchema<T extends z.ZodType>(data: T) {
  return z.object({
    status: z.number().int(),
    code: z.literal(''),
    message: z.literal('success'),
    data,
  });
}

export const ApiErrorSchema = z.object({
  status: z.number().int(),
  code: ErrorCodeSchema,
  message: z.union([z.string(), z.array(z.string())]),
  data: z.null(),
});

export function listSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    nextCursor: z.string().nullable().optional(),
  });
}
