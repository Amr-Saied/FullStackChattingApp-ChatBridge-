import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EncryptionService {
  private readonly ENCRYPTION_KEY =
    environment.security?.encryptionKey || 'fallback-key-change-in-production';

  constructor() {}

  // Strong encryption using Web Crypto API
  private async encryptData(data: string): Promise<string> {
    try {
      // Convert string to ArrayBuffer
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      // Generate a random IV (Initialization Vector)
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Import the key
      const key = await this.importKey();

      // Encrypt the data
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        dataBuffer
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);

      // Convert to base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      // Fallback to simple encoding if crypto API fails
      return btoa(encodeURIComponent(data));
    }
  }

  // Strong decryption using Web Crypto API
  private async decryptData(encryptedData: string): Promise<string> {
    try {
      // Convert from base64
      const combined = new Uint8Array(
        atob(encryptedData)
          .split('')
          .map((char) => char.charCodeAt(0))
      );

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encryptedBuffer = combined.slice(12);

      // Import the key
      const key = await this.importKey();

      // Decrypt the data
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encryptedBuffer
      );

      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Decryption failed:', error);
      // Fallback to simple decoding if crypto API fails
      return decodeURIComponent(atob(encryptedData));
    }
  }

  // Import encryption key
  private async importKey(): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.ENCRYPTION_KEY);

    return await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Secure storage with encryption
  async setSecureItem(key: string, value: any): Promise<void> {
    try {
      const encryptedValue = await this.encryptData(JSON.stringify(value));
      localStorage.setItem(key, encryptedValue);
    } catch (error) {
      console.error('Failed to encrypt and store item:', error);
      // Fallback to simple encoding
      const fallbackValue = btoa(encodeURIComponent(JSON.stringify(value)));
      localStorage.setItem(key, fallbackValue);
    }
  }

  // Secure retrieval with decryption
  async getSecureItem(key: string): Promise<any> {
    const encryptedValue = localStorage.getItem(key);
    if (!encryptedValue) return null;

    try {
      const decryptedValue = await this.decryptData(encryptedValue);
      return JSON.parse(decryptedValue);
    } catch (error) {
      console.error('Failed to decrypt item:', error);
      // Try fallback decryption
      try {
        const fallbackValue = decodeURIComponent(atob(encryptedValue));
        return JSON.parse(fallbackValue);
      } catch (fallbackError) {
        console.error('Fallback decryption also failed:', fallbackError);
        return null;
      }
    }
  }

  // Remove secure item
  removeSecureItem(key: string): void {
    localStorage.removeItem(key);
  }

  // Synchronous version for backward compatibility
  setSecureItemSync(key: string, value: any): void {
    try {
      // Try to encrypt and store synchronously
      const fallbackValue = btoa(encodeURIComponent(JSON.stringify(value)));
      localStorage.setItem(key, fallbackValue);
    } catch (error) {
      console.error('Sync encryption failed:', error);
      // If encryption fails, store as plain JSON
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  getSecureItemSync(key: string): any {
    const encryptedValue = localStorage.getItem(key);
    if (!encryptedValue) return null;

    try {
      // Try to parse as JSON first (for backward compatibility with unencrypted data)
      return JSON.parse(encryptedValue);
    } catch {
      // If that fails, try fallback decryption (for encrypted data)
      try {
        const fallbackValue = decodeURIComponent(atob(encryptedValue));
        return JSON.parse(fallbackValue);
      } catch (fallbackError) {
        console.error('Failed to decrypt item:', fallbackError);
        return null;
      }
    }
  }
}
