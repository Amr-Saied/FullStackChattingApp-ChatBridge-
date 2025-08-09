import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../_services/translation.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="language-switcher">
      <button
        class="btn btn-outline-light btn-sm me-1"
        (click)="switchLanguage('en')"
        [class.active]="currentLang === 'en'"
        title="English"
      >
        🇺🇸 EN
      </button>
      <button
        class="btn btn-outline-light btn-sm"
        (click)="switchLanguage('ar')"
        [class.active]="currentLang === 'ar'"
        title="العربية"
      >
        🇸🇦 AR
      </button>
    </div>
  `,
  styles: [
    `
      .language-switcher {
        display: flex;
        align-items: center;
        position: relative;
        z-index: 1030;
      }

      .language-switcher .btn {
        font-size: 0.75rem;
        padding: 0.2rem 0.4rem;
        border-radius: 0.25rem;
        transition: all 0.2s;
        white-space: nowrap;
        overflow: visible;
        position: relative;
        z-index: 1031;
      }

      .language-switcher .btn.active {
        background-color: #007bff;
        border-color: #007bff;
        color: white;
      }

      .language-switcher .btn:hover {
        transform: translateY(-1px);
        z-index: 1032;
      }

      /* Ensure buttons are fully visible */
      .language-switcher .btn:focus {
        box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        z-index: 1032;
      }

      /* Fix for navbar overflow issues */
      @media (max-width: 768px) {
        .language-switcher {
          flex-shrink: 0;
        }

        .language-switcher .btn {
          font-size: 0.7rem;
          padding: 0.15rem 0.3rem;
        }
      }
    `,
  ],
})
export class LanguageSwitcher {
  currentLang: string = 'en';

  constructor(private translationService: TranslationService) {
    this.currentLang = this.translationService.getCurrentLang();
  }

  switchLanguage(lang: string) {
    this.currentLang = lang;
    this.translationService.setLanguage(lang);

    // Reload the page to apply changes
    window.location.reload();
  }
}
