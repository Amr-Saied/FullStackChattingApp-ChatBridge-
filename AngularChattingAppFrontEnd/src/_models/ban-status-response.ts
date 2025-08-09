import { BanUserData } from './ban-user-data';

export interface BanStatusResponse extends Omit<BanUserData, 'userId'> {
  userId: number;
  isBanned: boolean;
  message?: string;
}
