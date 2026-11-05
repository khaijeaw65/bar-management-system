export interface MembershipRow {
  groupId: string;
  groupName: string;
  validFrom: Date;
  validUntil: Date | null;
}
