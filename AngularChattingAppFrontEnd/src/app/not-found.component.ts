import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AccountService } from '../_services/account.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  template: `
    <div class="error-page">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>Sorry, the page you are looking for does not exist.</p>
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
        color: #667eea;
        background: var(--main-gradient);
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
export class NotFoundComponent {
  isAdmin = false;
  constructor(private router: Router, private accountService: AccountService) {
    const user = this.accountService.getLoggedUserFromStorageSync();
    this.isAdmin = !!user && user.role === 'Admin';
  }
  goBack() {
    if (this.isAdmin) {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/home']);
    }
  }
}
