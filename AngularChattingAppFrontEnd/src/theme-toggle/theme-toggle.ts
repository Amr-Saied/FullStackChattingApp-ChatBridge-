import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../_services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="theme-toggle-btn"
      (click)="toggleTheme()"
      [title]="isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
      type="button"
    >
      <i
        class="theme-icon"
        [class.fas]="true"
        [class.fa-sun]="isDarkTheme"
        [class.fa-moon]="!isDarkTheme"
      >
      </i>
    </button>
  `,
  styles: [
    `
      .theme-toggle-btn {
        background: none;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
        color: #fff;
        position: relative;
        overflow: hidden;
      }

      .theme-toggle-btn:hover {
        border-color: rgba(255, 255, 255, 0.6);
        background: rgba(255, 255, 255, 0.1);
        transform: scale(1.05);
      }

      .theme-toggle-btn:active {
        transform: scale(0.95);
      }

      .theme-icon {
        font-size: 16px;
        transition: all 0.4s ease;
        color: #fff;
      }

      .theme-icon.fa-sun {
        color: #ffd700;
        filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
      }

      .theme-icon.fa-moon {
        color: #c9d1d9;
        filter: drop-shadow(0 0 8px rgba(201, 209, 217, 0.4));
      }

      :host-context(body.dark-theme) .theme-toggle-btn {
        border-color: rgba(201, 209, 217, 0.3);
        color: #c9d1d9;
      }

      :host-context(body.dark-theme) .theme-toggle-btn:hover {
        border-color: rgba(201, 209, 217, 0.6);
        background: rgba(201, 209, 217, 0.1);
      }

      :host-context(.navbar) .theme-toggle-btn {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
      }

      :host-context(.navbar) .theme-toggle-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: #fff;
      }

      @media (max-width: 768px) {
        .theme-toggle-btn {
          width: 36px;
          height: 36px;
        }

        .theme-icon {
          font-size: 14px;
        }
      }
    `,
  ],
})
export class ThemeToggle implements OnInit {
  isDarkTheme: boolean = false;

  constructor(private themeService: ThemeService) {}

  ngOnInit() {
    // Subscribe to theme changes
    this.themeService.getTheme().subscribe((isDark) => {
      this.isDarkTheme = isDark;
    });
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
