import {
  ApproveAccessRequestSchema,
  ListAccessRequestsQuerySchema,
  MembershipInputSchema,
  ReplaceMembershipsSchema,
  SetPinRequestSchema,
  UpdateStaffSchema,
} from './staff.js';

const GROUP = '00000000-0000-4000-8000-000000000003';

describe('MembershipInputSchema', () => {
  it.each(['permanent', 'end_of_night', '2026-11-01T06:00:00+07:00', '2026-11-01T00:00:00Z'])(
    'accepts until %s',
    (until) => {
      expect(MembershipInputSchema.safeParse({ groupId: GROUP, until }).success).toBe(true);
    },
  );

  it.each(['tonight', '2026-11-01', '', 'Permanent'])('rejects until %s', (until) => {
    expect(MembershipInputSchema.safeParse({ groupId: GROUP, until }).success).toBe(false);
  });

  it('rejects a group id that is not a uuid', () => {
    expect(MembershipInputSchema.safeParse({ groupId: 'x', until: 'permanent' }).success).toBe(false);
  });
});

describe('ApproveAccessRequestSchema', () => {
  it('trims the name and needs at least one membership', () => {
    const memberships = [{ groupId: GROUP, until: 'permanent' }];
    expect(ApproveAccessRequestSchema.parse({ displayName: '  บีม ', memberships }).displayName).toBe('บีม');
    expect(ApproveAccessRequestSchema.safeParse({ displayName: 'บีม', memberships: [] }).success).toBe(false);
    expect(ApproveAccessRequestSchema.safeParse({ displayName: '  ', memberships }).success).toBe(false);
  });
});

describe('other staff bodies', () => {
  it('PUT memberships may be empty', () => {
    expect(ReplaceMembershipsSchema.safeParse({ memberships: [] }).success).toBe(true);
  });

  it('PATCH needs at least one field', () => {
    expect(UpdateStaffSchema.safeParse({}).success).toBe(false);
    expect(UpdateStaffSchema.safeParse({ isActive: false }).success).toBe(true);
  });

  it('access-request status defaults to pending and refuses approved', () => {
    expect(ListAccessRequestsQuerySchema.parse({}).status).toBe('pending');
    expect(ListAccessRequestsQuerySchema.safeParse({ status: 'approved' }).success).toBe(false);
  });

  it('SetPinRequestSchema requires 4-digit pin and accepts optional 4-digit currentPin', () => {
    expect(SetPinRequestSchema.safeParse({ pin: '1234' }).success).toBe(true);
    expect(SetPinRequestSchema.safeParse({ pin: '1234', currentPin: '5678' }).success).toBe(true);
    expect(SetPinRequestSchema.safeParse({ pin: '123' }).success).toBe(false);
    expect(SetPinRequestSchema.safeParse({ pin: '12345' }).success).toBe(false);
    expect(SetPinRequestSchema.safeParse({ pin: 'abcd' }).success).toBe(false);
    expect(SetPinRequestSchema.safeParse({ pin: '1234', currentPin: '99' }).success).toBe(false);
  });
});
