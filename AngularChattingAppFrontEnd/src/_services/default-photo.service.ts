import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DefaultPhotoService {
  // Default profile image - a professional, minimalist user icon
  private readonly DEFAULT_PROFILE_IMAGE = 'assets/default-user.svg';

  getDefaultProfileImage(): string {
    return this.DEFAULT_PROFILE_IMAGE;
  }

  // Check if the given URL is a default image
  isDefaultImage(url: string | undefined): boolean {
    if (!url) return true;
    return (
      url.includes('randomuser.me/api/portraits/lego/') ||
      url === this.DEFAULT_PROFILE_IMAGE ||
      url.includes('data:image/svg+xml')
    );
  }

  // Get profile image URL with fallback to default
  getProfileImageUrl(photoUrl: string | undefined): string {
    if (!photoUrl) {
      return this.DEFAULT_PROFILE_IMAGE;
    }

    if (this.isDefaultImage(photoUrl)) {
      return this.DEFAULT_PROFILE_IMAGE;
    }

    return photoUrl;
  }
}
