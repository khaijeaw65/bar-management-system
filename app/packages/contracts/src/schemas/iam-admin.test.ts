import { PERMISSION_CATALOG, CreatePolicySchema, CreateStaffGroupSchema, UpdatePolicySchema } from './iam-admin.js';
import { PERMISSION_CODES } from './permissions.js';

describe('PERMISSION_CATALOG', () => {
  it('lists every permission code exactly once, under its own resource', () => {
    const listed = PERMISSION_CATALOG.flatMap((row) => row.actions.map((action) => action.code));
    expect([...listed].sort()).toEqual([...PERMISSION_CODES].sort());
    for (const row of PERMISSION_CATALOG) {
      for (const action of row.actions) expect(action.code.startsWith(`${row.resource}:`)).toBe(true);
    }
  });

  it('gives every row and action a Thai label', () => {
    for (const row of PERMISSION_CATALOG) {
      expect(row.label).toMatch(/[ก-๙]/);
      for (const action of row.actions) expect(action.label).toMatch(/[ก-๙]/);
    }
  });
});

describe('IAM admin inputs', () => {
  it('rejects a code outside the catalog in a matrix write', () => {
    expect(CreatePolicySchema.safeParse({ name: 'รับเงิน', codes: ['orders:nonexistent'] }).success).toBe(false);
  });

  it('trims names and rejects a blank one', () => {
    expect(CreateStaffGroupSchema.parse({ name: '  แคชเชียร์ ', policyIds: [] }).name).toBe('แคชเชียร์');
    expect(CreateStaffGroupSchema.safeParse({ name: '   ', policyIds: [] }).success).toBe(false);
  });

  it('needs at least one field to update', () => {
    expect(UpdatePolicySchema.safeParse({}).success).toBe(false);
    expect(UpdatePolicySchema.safeParse({ description: 'x' }).success).toBe(true);
  });
});
