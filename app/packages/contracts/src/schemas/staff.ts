import { z } from 'zod';
import { IsoDateTimeSchema, UuidSchema } from './common.js';
import { PermissionCodeSchema } from './permissions.js';

/** BRIEF-054 §3. CD-13 R4 — rejected stays rejected until reopened. */
export const AccessRequestStatusSchema = z.enum(['pending', 'approved', 'rejected']);
export type AccessRequestStatus = z.infer<typeof AccessRequestStatusSchema>;

export const AccessRequestSchema = z.object({
  id: UuidSchema,
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  status: AccessRequestStatusSchema,
  requestedAt: IsoDateTimeSchema,
  decidedAt: IsoDateTimeSchema.nullable(),
});
export type AccessRequest = z.infer<typeof AccessRequestSchema>;

export const ListAccessRequestsQuerySchema = z.object({
  status: z.enum(['pending', 'rejected']).default('pending'),
});
export type ListAccessRequestsQuery = z.infer<typeof ListAccessRequestsQuerySchema>;

/** `end_of_night` = the next venue business-day cut-off; an ISO time must be in the future (checked on the server). */
export const MembershipUntilSchema = z.union([
  z.literal('permanent'),
  z.literal('end_of_night'),
  IsoDateTimeSchema,
]);

export const MembershipInputSchema = z.object({
  groupId: UuidSchema,
  until: MembershipUntilSchema,
});
export type MembershipInput = z.infer<typeof MembershipInputSchema>;

export const ApproveAccessRequestSchema = z.object({
  displayName: z.string().trim().min(1, 'กรุณากรอกชื่อ').max(200, 'ชื่อยาวเกิน 200 ตัวอักษร'),
  memberships: z.array(MembershipInputSchema).min(1, 'ต้องเลือกกลุ่มอย่างน้อย 1 กลุ่ม'),
});
export type ApproveAccessRequest = z.infer<typeof ApproveAccessRequestSchema>;

export const MembershipStateSchema = z.enum(['live', 'future', 'expired']);
export type MembershipState = z.infer<typeof MembershipStateSchema>;

export const StaffMembershipSchema = z.object({
  groupId: UuidSchema,
  groupName: z.string(),
  validFrom: IsoDateTimeSchema,
  validUntil: IsoDateTimeSchema.nullable(),
  state: MembershipStateSchema,
});
export type StaffMembership = z.infer<typeof StaffMembershipSchema>;

export const StaffMemberSchema = z.object({
  id: UuidSchema,
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  isActive: z.boolean(),
  memberships: z.array(StaffMembershipSchema),
  /** Personal policies attached to this person (BRIEF-055). */
  policyIds: z.array(UuidSchema),
});
export type StaffMember = z.infer<typeof StaffMemberSchema>;

export const UpdateStaffSchema = z
  .object({
    displayName: z.string().trim().min(1, 'กรุณากรอกชื่อ').max(200, 'ชื่อยาวเกิน 200 ตัวอักษร'),
    isActive: z.boolean(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'ต้องระบุอย่างน้อยหนึ่งค่า');
export type UpdateStaff = z.infer<typeof UpdateStaffSchema>;

export const ReplaceMembershipsSchema = z.object({
  memberships: z.array(MembershipInputSchema),
});
export type ReplaceMemberships = z.infer<typeof ReplaceMembershipsSchema>;

export const PermissionSourceKindSchema = z.enum(['group', 'user']);

export const EffectivePermissionsSchema = z.object({
  permissions: z.array(
    z.object({
      code: PermissionCodeSchema,
      sources: z.array(
        z.object({
          kind: PermissionSourceKindSchema,
          groupName: z.string().optional(),
          policyName: z.string(),
        }),
      ),
    }),
  ),
});
export type EffectivePermissions = z.infer<typeof EffectivePermissionsSchema>;

/** 409 `IAM_LOCKOUT` `data`. */
export const IamLockoutDataSchema = z.object({ reason: z.literal('last_manager') });
export type IamLockoutData = z.infer<typeof IamLockoutDataSchema>;

export const SetPinRequestSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, 'PIN ต้องเป็นตัวเลข 4 หลัก'),
  currentPin: z.string().regex(/^\d{4}$/, 'PIN ต้องเป็นตัวเลข 4 หลัก').optional(),
});
export type SetPinRequest = z.infer<typeof SetPinRequestSchema>;
