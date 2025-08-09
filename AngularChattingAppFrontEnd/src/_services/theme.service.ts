import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private isDarkTheme = new BehaviorSubject<boolean>(false);

  constructor() {
    // Check if user had a saved preference
    const savedTheme = localStorage.getItem('darkTheme');
    if (savedTheme) {
      this.setTheme(savedTheme === 'true');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      this.setTheme(prefersDark);
    }
  }

  // Get current theme state
  getTheme() {
    return this.isDarkTheme.asObservable();
  }

  // Get current theme value
  isDark(): boolean {
    return this.isDarkTheme.value;
  }

  // Toggle between light and dark
  toggleTheme() {
    this.setTheme(!this.isDarkTheme.value);
  }

  // Set specific theme
  setTheme(isDark: boolean) {
    this.isDarkTheme.next(isDark);

    // Save preference
    localStorage.setItem('darkTheme', isDark.toString());

    // Apply theme to document
    if (isDark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
}
