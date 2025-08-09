export interface BanUserData {
  userId: number;
  banReason?: string;
  banExpiryDate?: string;
  isPermanentBan: boolean;
}
