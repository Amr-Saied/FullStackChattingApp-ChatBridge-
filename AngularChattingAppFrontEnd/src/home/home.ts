import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Register } from '../register/register';
import { AccountService } from '../_services/account.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, Register],
  templateUrl: './home.html',
  styleUrl: './home.css',
  standalone: true,
})
export class Home implements OnInit, OnDestroy {
  registerMode = false;
  loggedIn = false;
  private loginSubscription?: Subscription;

  constructor(private accountService: AccountService) {}

  ngOnInit() {
    this.checkLoginStatus();
    this.loginSubscription = this.accountService
      .getLoginState()
      .subscribe((isLoggedIn) => {
        this.loggedIn = isLoggedIn;
      });
  }

  ngOnDestroy() {
    if (this.loginSubscription) {
      this.loginSubscription.unsubscribe();
    }
  }

  checkLoginStatus() {
    this.loggedIn = this.accountService.isLoggedIn();
  }

  registerToggle() {
    this.registerMode = !this.registerMode;
  }

  goBackToWelcome() {
    this.registerMode = false;
  }
}
