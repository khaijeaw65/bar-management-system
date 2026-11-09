export interface ResolveApprovalInput {
  callerId: string;
  pin?: string;
  kind: 'void' | 'comp';
}

export interface ApprovalOutcome {
  approvedBy: string | null;
  selfApproved: boolean;
}
