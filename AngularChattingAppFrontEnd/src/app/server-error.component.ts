import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AccountService } from '../_services/account.service';

@Component({
  selector: 'app-server-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="error-page">
      <h1>{{ error?.statusCode || 500 }}</h1>
      <h2>Server Error</h2>
      <p *ngIf="error?.message">{{ error.message }}</p>
      <div *ngIf="isAdmin && error?.details">
        <h4>Details:</h4>
        <pre>{{ error.details }}</pre>
      </div>
      <button (click)="goBack()" class="btn btn-main mt-3">
        {{ isAdmin ? 'Go to Admin Panel' : 'Go to Home' }}
      </button>
    </div>
  `,
  styles: [
    `
      .error-page {
        text-align: center;
        margin-top: 80px;
        color: #764ba2;
      }
      .error-page h1 {
        font-size: 7rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
        color: #ff6b6b;
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .error-page h2 {
        font-size: 2.5rem;
        margin-bottom: 1rem;
      }
      .error-page p {
        font-size: 1.2rem;
        margin-bottom: 2rem;
      }
      .error-details {
        text-align: left;
        margin: 2rem auto;
        max-width: 800px;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
      }
      .error-details h3 {
        color: #ff6b6b;
        margin-bottom: 1rem;
      }
      .error-details pre {
        background: rgba(0, 0, 0, 0.05);
        padding: 1rem;
        border-radius: 4px;
        overflow-x: auto;
        white-space: pre-wrap;
        word-wrap: break-word;
      }
      .btn-main {
        background: var(--main-gradient);
        color: #fff;
        border-radius: 8px;
        padding: 12px 30px;
        font-weight: 600;
        text-decoration: none;
        transition: background 0.3s;
      }
      .btn-main:hover {
        background: var(--main-gradient-hover);
        color: #fff;
      }
    `,
  ],
})
export class ServerErrorComponent {
  isAdmin = false;
  error: any;

  constructor(private router: Router, private accountService: AccountService) {
    const user = this.accountService.getLoggedUserFromStorageSync();
    this.isAdmin = !!user && user.role === 'Admin';
    // Get error details from navigation state
    const nav = this.router.getCurrentNavigation();
    this.error = nav?.extras?.state?.['error'];
  }

  goBack() {
    if (this.isAdmin) {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/home']);
    }
  }
}
