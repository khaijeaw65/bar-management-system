import { z } from 'zod';
import { UuidSchema } from './common.js';
import { TableSeatKindSchema } from './enums.js';

export const SeatAdminSchema = z.object({
  id: UuidSchema,
  label: z.string().trim().min(1, 'ต้องระบุชื่อโต๊ะ').max(20, 'ชื่อโต๊ะยาวเกินไป'),
  kind: TableSeatKindSchema,
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  qrToken: z.string(),
  hasLiveVisit: z.boolean(),
});
export type SeatAdmin = z.infer<typeof SeatAdminSchema>;

export const SeatAdminListSchema = z.object({
  items: z.array(SeatAdminSchema),
});
export type SeatAdminList = z.infer<typeof SeatAdminListSchema>;

export const CreateSeatRequestSchema = z.object({
  label: z.string().trim().min(1, 'ต้องระบุชื่อโต๊ะ').max(20, 'ชื่อโต๊ะยาวเกินไป'),
  kind: TableSeatKindSchema,
});
export type CreateSeatRequest = z.infer<typeof CreateSeatRequestSchema>;

export const UpdateSeatRequestSchema = z
  .object({
    label: z.string().trim().min(1, 'ต้องระบุชื่อโต๊ะ').max(20, 'ชื่อโต๊ะยาวเกินไป').optional(),
    kind: TableSeatKindSchema.optional(),
  })
  .refine((data) => data.label !== undefined || data.kind !== undefined, {
    message: 'ต้องระบุข้อมูลที่ต้องการแก้ไขอย่างน้อยหนึ่งค่า',
  });
export type UpdateSeatRequest = z.infer<typeof UpdateSeatRequestSchema>;

export const ReorderSeatsRequestSchema = z.object({
  kind: TableSeatKindSchema,
  ids: z.array(UuidSchema),
});
export type ReorderSeatsRequest = z.infer<typeof ReorderSeatsRequestSchema>;
