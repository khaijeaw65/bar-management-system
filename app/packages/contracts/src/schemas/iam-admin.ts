import { z } from 'zod';
import { UuidSchema } from './common.js';
import { PermissionCodeSchema, type PermissionCode } from './permissions.js';

/** BRIEF-055 §3. The matrix rows CD-13 draws: one entry per resource, Thai labels in this one place. */
export const PERMISSION_CATALOG: ReadonlyArray<{
  resource: string;
  label: string;
  actions: ReadonlyArray<{ code: PermissionCode; label: string }>;
}> = [
  {
    resource: 'menu',
    label: 'เมนู',
    actions: [
      { code: 'menu:read', label: 'ดูเมนู' },
      { code: 'menu:write', label: 'แก้ไขเมนู' },
      { code: 'menu:toggle_availability', label: 'เปิด/ปิดขายเมนู' },
    ],
  },
  {
    resource: 'orders',
    label: 'ออเดอร์',
    actions: [
      { code: 'orders:read', label: 'ดูออเดอร์' },
      { code: 'orders:create', label: 'สั่งอาหาร' },
      { code: 'orders:update_status', label: 'เปลี่ยนสถานะออเดอร์' },
    ],
  },
  {
    resource: 'payments',
    label: 'การชำระเงิน',
    actions: [
      { code: 'payments:read', label: 'ดูการชำระเงิน' },
      { code: 'payments:create', label: 'เปิดบิลชำระเงิน' },
      { code: 'payments:mark_paid', label: 'ยืนยันรับเงิน' },
    ],
  },
  { resource: 'reports', label: 'รายงาน', actions: [{ code: 'reports:read', label: 'ดูรายงาน' }] },
  {
    resource: 'tables',
    label: 'โต๊ะ',
    actions: [
      { code: 'tables:read', label: 'ดูโต๊ะ' },
      { code: 'tables:manage', label: 'จัดการโต๊ะ' },
    ],
  },
  {
    resource: 'visits',
    label: 'การเปิดโต๊ะ',
    actions: [
      { code: 'visits:read', label: 'ดูโต๊ะที่เปิดอยู่' },
      { code: 'visits:open', label: 'เปิดโต๊ะ' },
      { code: 'visits:close', label: 'ปิดโต๊ะ' },
    ],
  },
  {
    resource: 'venue',
    label: 'ร้าน',
    actions: [
      { code: 'venue:read', label: 'ดูข้อมูลร้าน' },
      { code: 'venue:update', label: 'แก้ไขข้อมูลร้าน' },
      { code: 'venue:read_payment', label: 'ดูบัญชีรับเงิน' },
      { code: 'venue:update_payment', label: 'เปลี่ยนบัญชีรับเงิน' },
    ],
  },
  { resource: 'staff', label: 'พนักงาน', actions: [{ code: 'staff:manage', label: 'จัดการพนักงานและสิทธิ์' }] },
];

export const PermissionCatalogSchema = z.array(
  z.object({
    resource: z.string(),
    label: z.string(),
    actions: z.array(z.object({ code: PermissionCodeSchema, label: z.string() })),
  }),
);
export type PermissionCatalog = z.infer<typeof PermissionCatalogSchema>;

/** The seeded rows that can never be deleted or (เจ้าของ / ทั้งหมด) edited. `null` = a custom row. */
export const SystemGroupSchema = z.enum(['owner', 'manager', 'staff']);
export type SystemGroup = z.infer<typeof SystemGroupSchema>;

const NameSchema = z.string().trim().min(1, 'กรุณากรอกชื่อ').max(100, 'ชื่อยาวเกิน 100 ตัวอักษร');
const DescriptionSchema = z.string().trim().max(500, 'คำอธิบายยาวเกิน 500 ตัวอักษร');
const PolicyIdsSchema = z.array(UuidSchema);
const CodesSchema = z.array(PermissionCodeSchema);

export const StaffGroupSchema = z.object({
  id: UuidSchema,
  name: z.string(),
  description: z.string().nullable(),
  system: SystemGroupSchema.nullable(),
  policyIds: z.array(UuidSchema),
  memberCount: z.number().int().min(0),
});
export type StaffGroup = z.infer<typeof StaffGroupSchema>;

export const CreateStaffGroupSchema = z.object({
  name: NameSchema,
  description: DescriptionSchema.optional(),
  policyIds: PolicyIdsSchema,
});
export type CreateStaffGroup = z.infer<typeof CreateStaffGroupSchema>;

const UpdateNameAndDescription = z
  .object({ name: NameSchema, description: DescriptionSchema })
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'ต้องระบุอย่างน้อยหนึ่งค่า');

export const UpdateStaffGroupSchema = UpdateNameAndDescription;
export type UpdateStaffGroup = z.infer<typeof UpdateStaffGroupSchema>;

export const SetPolicyIdsSchema = z.object({ policyIds: PolicyIdsSchema });
export type SetPolicyIds = z.infer<typeof SetPolicyIdsSchema>;

export const DeleteImpactSchema = z.object({
  members: z.array(
    z.object({
      staffId: UuidSchema,
      displayName: z.string(),
      losing: z.array(PermissionCodeSchema),
    }),
  ),
});
export type DeleteImpact = z.infer<typeof DeleteImpactSchema>;

export const PolicySchema = z.object({
  id: UuidSchema,
  name: z.string(),
  description: z.string().nullable(),
  system: z.literal('all').nullable(),
  codes: z.array(PermissionCodeSchema),
  usage: z.object({
    groups: z.number().int().min(0),
    users: z.number().int().min(0),
    /** Distinct active-or-not staff reached through a group membership or a direct attach. */
    people: z.number().int().min(0),
  }),
});
export type Policy = z.infer<typeof PolicySchema>;

export const CreatePolicySchema = z.object({
  name: NameSchema,
  description: DescriptionSchema.optional(),
  codes: CodesSchema,
});
export type CreatePolicy = z.infer<typeof CreatePolicySchema>;

export const UpdatePolicySchema = UpdateNameAndDescription;
export type UpdatePolicy = z.infer<typeof UpdatePolicySchema>;

export const SetPolicyCodesSchema = z.object({ codes: CodesSchema });
export type SetPolicyCodes = z.infer<typeof SetPolicyCodesSchema>;

/** 409 `POLICY_IN_USE` `data`. */
export const PolicyInUseDataSchema = z.object({
  groups: z.array(z.string()),
  users: z.array(z.string()),
});
export type PolicyInUseData = z.infer<typeof PolicyInUseDataSchema>;
