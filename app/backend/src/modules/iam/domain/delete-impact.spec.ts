import { deleteImpact } from './delete-impact.js';
import type { MemberCodeRow } from './iam-admin.types.js';

const row = (staffId: string, code: MemberCodeRow['code'], via: MemberCodeRow['via']): MemberCodeRow => ({
  staffId,
  displayName: staffId,
  code,
  via,
});

describe('deleteImpact', () => {
  const members = [
    { staffId: 'a', displayName: 'A' },
    { staffId: 'b', displayName: 'B' },
    { staffId: 'c', displayName: 'C' },
  ];

  it('lists only the codes the deleted group alone gave the person', () => {
    const impact = deleteImpact(members, [
      row('a', 'payments:read', 'group'),
      row('a', 'payments:mark_paid', 'group'),
      row('a', 'payments:read', 'elsewhere'),
      row('b', 'payments:mark_paid', 'group'),
    ]);
    expect(impact.members[0]?.losing).toEqual(['payments:mark_paid']);
    expect(impact.members[1]?.losing).toEqual(['payments:mark_paid']);
  });

  it('loses nothing when every code is held elsewhere, or the membership is not live', () => {
    const impact = deleteImpact(members, [
      row('a', 'orders:read', 'group'),
      row('a', 'orders:read', 'elsewhere'),
    ]);
    expect(impact.members.map((member) => member.losing)).toEqual([[], [], []]);
  });

  it('counts a code granted twice by the group once', () => {
    const impact = deleteImpact(members, [row('a', 'menu:read', 'group'), row('a', 'menu:read', 'group')]);
    expect(impact.members[0]?.losing).toEqual(['menu:read']);
  });
});
