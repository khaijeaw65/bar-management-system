import type { AccessRequestStatus } from '@bar/contracts';

export interface RequestSql {
  id: string;
  external_id: string;
  provider: 'line' | 'phone_otp';
  display_name: string | null;
  avatar_url: string | null;
  status: AccessRequestStatus;
  requested_at: Date;
  decided_at: Date | null;
}

export interface StaffSql {
  id: string;
  display_name: string;
  is_active: boolean;
  avatar_url: string | null;
}

export interface MembershipSql {
  user_id: string;
  group_id: string;
  group_name: string;
  valid_from: Date;
  valid_until: Date | null;
}
