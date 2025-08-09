export interface LoggedUser {
  id: number;
  username: string;
  token: string;
  refreshToken: string;
  role: string;
  tokenExpires?: Date;
  refreshTokenExpires?: Date;
}
