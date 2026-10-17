export interface StaffUserView {
  id: string;
  displayName: string;
  isActive: boolean;
  avatarUrl: string | null;
}

export interface StaffUserLookup {
  id: string;
  isActive?: boolean;
}
