import { Injectable } from '@angular/core';
import { LoggedUser } from '../_models/logged-user';
import { EncryptionService } from './encryption.service';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  constructor(private encryptionService: EncryptionService) {}

  getToken(): string | null {
    const loggedUser = this.encryptionService.getSecureItemSync('loggedUser');
    if (loggedUser) {
      return loggedUser?.token || null;
    }
    return null;
  }

  getLoggedUser(): LoggedUser | null {
    return this.encryptionService.getSecureItemSync('loggedUser');
  }

  getRefreshToken(): string | null {
    const loggedUser = this.encryptionService.getSecureItemSync('loggedUser');
    return loggedUser?.refreshToken || null;
  }

  isTokenExpired(): boolean {
    const loggedUser = this.getLoggedUser();
    if (!loggedUser?.tokenExpires) return true;

    const expiresAt = new Date(loggedUser.tokenExpires);
    return expiresAt <= new Date();
  }

  isTokenValid(): boolean {
    const token = this.getToken();
    return token !== null && token.length > 0;
  }
}
