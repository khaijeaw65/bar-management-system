export interface MembershipSql {
  group_id: string;
  group_name: string;
  valid_from: Date;
  valid_until: Date | null;
}
