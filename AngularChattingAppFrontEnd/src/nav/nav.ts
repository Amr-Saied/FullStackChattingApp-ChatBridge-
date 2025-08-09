// nav.ts
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { AccountService } from '../_services/account.service';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { DefaultPhotoService } from '../_services/default-photo.service';
import { MemberService } from '../_services/member.service';
import { Member } from '../_models/member';
import { ThemeToggle } from '../theme-toggle/theme-toggle';
import { LoginFormsComponent } from './login-forms.component';
import { LanguageSwitcher } from './LanguageSwitcher/language-switcher';
import { TranslationService } from '../_services/translation.service';
import { StateService } from '../_services/state.service';
import { SignalRService } from '../_services/signalr.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  templateUrl: './nav.html',
  styleUrls: ['./nav.css'],
  imports: [
    CommonModule,
    RouterModule,
    LoginFormsComponent,
    ThemeToggle,
    LanguageSwitcher,
  ],
})
export class Nav implements OnInit, AfterViewInit {
  @ViewChild(LoginFormsComponent) loginFormsComponent!: LoginFormsComponent;

  loggedIn = false;
  currentUser: Member | null = null;
  showLoginModal = false;

  constructor(
    private accountService: AccountService,
    private router: Router,
    private toastr: ToastrService,
    private defaultPhotoService: DefaultPhotoService,
    private memberService: MemberService,
    public translationService: TranslationService, // Make it public so template can access it
    private stateService: StateService,
    private signalRService: SignalRService
  ) {}

  ngOnInit() {
    // Subscribe to state changes
    this.stateService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

    this.accountService.getLoginState().subscribe((isLoggedIn) => {
      this.loggedIn = isLoggedIn;
      if (isLoggedIn) {
        this.loadCurrentUser();
      } else {
        this.currentUser = null;
        // Clear any cached data when logged out
        this.stateService.clearState();
      }
    });
  }

  ngAfterViewInit() {
    // Ensure login form is properly initialized when view is ready
    if (this.loginFormsComponent) {
      this.loginFormsComponent.onLoginFormVisible();
    }
  }

  loadCurrentUser() {
    const loggedUser = this.accountService.getLoggedUserFromStorageSync();
    if (loggedUser && loggedUser.id) {
      this.memberService.getMemberById(loggedUser.id).subscribe({
        next: (member) => {
          this.currentUser = member;
          // Update the state service to ensure consistency
          this.stateService.updateCurrentUser(member);
        },
        error: (error) => {
          console.error('Error loading current user:', error);
        },
      });
    }
  }

  // Show login modal
  showLogin() {
    this.showLoginModal = true;
    // Give the modal time to render, then notify the login form
    setTimeout(() => {
      if (this.loginFormsComponent) {
        this.loginFormsComponent.onLoginFormVisible();
      }
    }, 200); // Increased delay to ensure modal is fully rendered
  }

  // Handle modal shown event
  onModalShown() {
    if (this.loginFormsComponent) {
      this.loginFormsComponent.onLoginFormVisible();
    }
  }

  // Handle login form ready event
  onLoginFormReady() {
    if (this.loginFormsComponent) {
      this.loginFormsComponent.onLoginFormVisible();
    }
  }

  // Handle login success
  onLoginSuccess(response: any) {
    this.loggedIn = true;
    this.showLoginModal = false;

    // Redirect based on user role
    if (response.role === 'Admin') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/home']);
    }
  }

  // Close login modal
  closeLoginModal() {
    this.showLoginModal = false;
  }

  logout(event?: Event) {
    // Prevent default behavior if event is provided
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Stop SignalR connection first
    this.signalRService.stopConnection();

    // Clear state immediately
    this.stateService.clearState();
    this.loggedIn = false;
    this.currentUser = null;

    // Call backend logout endpoint
    this.accountService.logout().subscribe({
      next: (response) => {
        // Navigate to home page
        this.router.navigate(['/home']);

        // Show success message
        this.toastr.success('Logged out successfully!', 'Logout Successful', {
          timeOut: 5000,
          closeButton: true,
          progressBar: true,
        });
      },
      error: (error) => {
        console.error('Logout error:', error);

        // Even if backend fails, navigate to home
        this.router.navigate(['/home']);

        this.toastr.success('Logged out successfully!', 'Logout Successful', {
          timeOut: 5000,
          closeButton: true,
          progressBar: true,
        });
      },
    });
  }

  getLoggedUsername(): string {
    return this.currentUser?.userName || this.currentUser?.knownAs || 'User';
  }

  getProfileImageUrl(): string {
    return this.defaultPhotoService.getProfileImageUrl(
      this.currentUser?.photoUrl
    );
  }
}
