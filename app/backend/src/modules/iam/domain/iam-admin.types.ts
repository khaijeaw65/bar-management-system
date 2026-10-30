import type { PermissionCode } from '@bar/contracts';

export interface GroupRow {
  id: string;
  name: string;
  description: string | null;
  policyIds: string[];
  /** Membership rows of every state — expired and future included. */
  memberCount: number;
}

export interface PolicyRow {
  id: string;
  name: string;
  description: string | null;
  codes: PermissionCode[];
  usage: { groups: number; users: number; people: number };
}

/** One code a member holds, and whether it comes through the group being deleted or from anywhere else. */
export interface MemberCodeRow {
  staffId: string;
  displayName: string;
  code: PermissionCode;
  via: 'group' | 'elsewhere';
}

export interface MemberRow {
  staffId: string;
  displayName: string;
}

export type GroupWriteOutcome =
  | { kind: 'ok'; id: string }
  | { kind: 'not_found' }
  | { kind: 'name_taken' }
  | { kind: 'unknown_policy' }
  | { kind: 'lockout' };

export type PolicyWriteOutcome =
  | { kind: 'ok'; id: string }
  | { kind: 'not_found' }
  | { kind: 'name_taken' }
  | { kind: 'unknown_code' }
  | { kind: 'in_use'; groups: string[]; users: string[] }
  | { kind: 'lockout' };

export interface NamedInput {
  name: string;
  description: string | null;
}
