import type { DeleteImpact } from '@bar/contracts';
import type { MemberCodeRow, MemberRow } from './iam-admin.types.js';

/** CD-13 R6: a member loses a code only when the deleted group was the one thing giving it (most-permissive wins). */
export function deleteImpact(members: MemberRow[], codes: MemberCodeRow[]): DeleteImpact {
  return {
    members: members.map((member) => {
      const mine = codes.filter((row) => row.staffId === member.staffId);
      const kept = new Set(mine.filter((row) => row.via === 'elsewhere').map((row) => row.code));
      const losing = [...new Set(mine.filter((row) => row.via === 'group').map((row) => row.code))]
        .filter((code) => !kept.has(code))
        .sort((a, b) => a.localeCompare(b));
      return { staffId: member.staffId, displayName: member.displayName, losing };
    }),
  };
}
