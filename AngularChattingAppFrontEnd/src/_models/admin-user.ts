export interface AdminUser {
  id: number;
  userName: string;
  knownAs: string;
  dateOfBirth: string;
  gender: string;
  introduction: string;
  lookingFor: string;
  interests: string;
  city: string;
  country: string;
  role: string;
  created: string;
  lastActive: string;
  isBanned: boolean;
  banReason?: string;
  banExpiryDate?: string;
  isPermanentBan: boolean;
  photoUrl?: string;
  age: number;
}
