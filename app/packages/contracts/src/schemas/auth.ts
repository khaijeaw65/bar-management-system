import { z } from 'zod';
import { UuidSchema } from './common.js';

export const AuthMeSchema = z.object({
  id: UuidSchema,
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
});

export type AuthMe = z.infer<typeof AuthMeSchema>;
