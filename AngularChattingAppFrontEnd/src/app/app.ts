import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Nav } from '../nav/nav';
import { RouterModule } from '@angular/router';
import { NgxSpinnerModule } from 'ngx-spinner';
import { AccountService } from '../_services/account.service';
import { SignalRService } from '../_services/signalr.service';
import { TokenService } from '../_services/token.service';
import { ThemeService } from '../_services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  standalone: true,
  imports: [CommonModule, Nav, RouterModule, NgxSpinnerModule],
})
export class App implements OnInit, OnDestroy {
  private loginSubscription: Subscription = new Subscription();

  constructor(
    private http: HttpClient,
    private accountService: AccountService,
    private signalRService: SignalRService,
    private tokenService: TokenService,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    // Check initial login state and connect if already logged in
    if (this.accountService.isLoggedIn()) {
      this.connectToSignalR();
    }

    // Subscribe to login state changes for global SignalR management
    this.loginSubscription = this.accountService
      .getLoginState()
      .subscribe((isLoggedIn) => {
        if (isLoggedIn) {
          // Only connect if not already connected
          this.connectToSignalR();
        } else {
          this.disconnectFromSignalR();
        }
      });
  }

  ngOnDestroy() {
    this.loginSubscription.unsubscribe();
    this.disconnectFromSignalR();
  }

  private connectToSignalR() {
    const token = this.tokenService.getToken();
    if (!token) return;

    this.signalRService
      .startConnection(token)
      .then(() => {
        // Join user group
        const currentUserId = this.accountService.getCurrentUserId();
        if (currentUserId && currentUserId > 0) {
          this.signalRService.joinUserGroup(currentUserId);
        }
      })
      .catch((error) => {
        // Don't log error if already connected
        if (
          !error.message?.includes(
            'Cannot start a HubConnection that is not in the'
          )
        ) {
          console.warn(
            'SignalR connection failed, but continuing without real-time features:',
            error.message
          );
        }
      });
  }

  private disconnectFromSignalR() {
    this.signalRService.stopConnection();
  }
}
