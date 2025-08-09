import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { AccountService } from '../_services/account.service';
import { ToastrService } from 'ngx-toastr';
import { Router, ActivatedRoute } from '@angular/router';
import { LoggedUser } from '../_models/logged-user';
import { ThemeService } from '../_services/theme.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-login-forms',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-forms.component.html',
  styleUrls: ['./login-forms.component.css'],
})
export class LoginFormsComponent implements OnInit, OnDestroy, AfterViewInit {
  @Output() loginSuccess = new EventEmitter<any>();
  @Output() closeModal = new EventEmitter<void>();
  @Output() formReady = new EventEmitter<void>();

  // Form states
  showForgotPassword = false;
  showForgotUsername = false;
  showResendConfirmation = false;
  showResetPassword = false;

  // Forms
  loginForm!: FormGroup;
  forgotPasswordForm!: FormGroup;
  forgotUsernameForm!: FormGroup;
  resendConfirmationForm!: FormGroup;
  resetPasswordForm!: FormGroup;

  // Loading states
  isLoading = false;
  isGoogleLoading = false;

  // Reset password token
  resetToken: string = '';

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private toastr: ToastrService,
    private router: Router,
    private route: ActivatedRoute,
    public themeService: ThemeService
  ) {
    this.initializeForms();
  }

  ngOnInit() {
    this.initializeForms();

    // Initialize Google Sign-In
    this.initializeGoogleSignIn();

    // Watch for URL parameter changes
    this.route.queryParams.subscribe((params) => {
      this.checkForResetToken();
    });

    // Subscribe to theme changes to re-render Google button
    this.themeService.getTheme().subscribe((isDark) => {
      // Re-render Google button when theme changes
      setTimeout(() => {
        this.renderGoogleButton();
      }, 100); // Small delay to ensure theme class is applied
    });
  }

  ngAfterViewInit() {
    // Emit form ready event
    this.formReady.emit();
  }

  ngOnDestroy() {
    // Clean up Google Sign-In if needed
    if (
      typeof (window as any).google !== 'undefined' &&
      (window as any).google.accounts
    ) {
      (window as any).google.accounts.id.disableAutoSelect();
    }
  }

  private initializeForms() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });

    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.forgotUsernameForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.resendConfirmationForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.resetPasswordForm = this.fb.group({
      token: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    });
  }

  private checkForResetToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');
    const username = urlParams.get('username');

    if (token) {
      this.resetToken = token;
      this.showResetPassword = true;
      this.resetPasswordForm.patchValue({ token });
    } else if (error === 'email_exists' && username) {
      // Handle email exists error from Google callback
      this.toastr.error(
        `An account with this email already exists. Please use your username (${username}) and password to login, or use a different Google account.`,
        'Email Already Exists',
        {
          timeOut: 10000,
          closeButton: true,
          progressBar: true,
        }
      );
      // Clear URL parameters
      this.router.navigate(['/'], { replaceUrl: true });
    } else {
      // Clear any existing URL parameters if no token found
      if (window.location.search) {
        this.router.navigate(['/'], { replaceUrl: true });
      }
      // Ensure we're showing the login form, not reset password
      this.showResetPassword = false;
    }
  }

  // Login with username/password
  login() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.toastr.clear();

      const model = {
        Username: this.loginForm.get('username')?.value,
        Password: this.loginForm.get('password')?.value,
      };

      this.accountService.login(model).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.handleLoginSuccess(response);
        },
        error: (error) => {
          this.isLoading = false;
          this.handleLoginError(error);
        },
      });
    }
  }

  // Google Login - Now handled by Google's official button
  // googleLogin() method removed - using Google's official sign-in button instead

  private handleGoogleSignIn(response: any) {
    this.isGoogleLoading = false;

    // Decode the JWT token to get user information
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));

      const googleLoginDto = {
        googleId: payload.sub, // Use the 'sub' field which is the Google ID
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      };

      this.accountService.googleLogin(googleLoginDto).subscribe({
        next: (response: any) => {
          this.handleLoginSuccess(response);
        },
        error: (error) => {
          this.handleLoginError(error);
        },
      });
    } catch (error) {
      console.error('Failed to process Google Sign-In response:', error);
      this.toastr.error('Failed to process Google Sign-In response', 'Error');
    }
  }

  // Forgot Password
  forgotPassword() {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      const email = this.forgotPasswordForm.get('email')?.value;

      this.accountService.forgotPassword(email).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.toastr.success(response.message, 'Email Sent');
          this.showForgotPassword = false;
          this.forgotPasswordForm.reset();
        },
        error: (error) => {
          console.error('Failed to send reset email:', error);
          this.isLoading = false;
          this.toastr.error('Failed to send reset email', 'Error');
        },
      });
    }
  }

  // Forgot Username
  forgotUsername() {
    if (this.forgotUsernameForm.valid) {
      this.isLoading = true;
      const email = this.forgotUsernameForm.get('email')?.value;

      this.accountService.forgotUsername(email).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.toastr.success(response.message, 'Email Sent');
          this.showForgotUsername = false;
          this.forgotUsernameForm.reset();
        },
        error: (error) => {
          console.error('Failed to send username reminder:', error);
          this.isLoading = false;
          this.toastr.error('Failed to send username reminder', 'Error');
        },
      });
    }
  }

  // Resend Confirmation Email
  resendConfirmation() {
    if (this.resendConfirmationForm.valid) {
      this.isLoading = true;
      const email = this.resendConfirmationForm.get('email')?.value;

      this.accountService.resendConfirmationEmail(email).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.toastr.success(response.message, 'Email Sent');
          this.showResendConfirmation = false;
          this.resendConfirmationForm.reset();
        },
        error: (error) => {
          console.error('Failed to send confirmation email:', error);
          this.isLoading = false;
          this.toastr.error('Failed to send confirmation email', 'Error');
        },
      });
    }
  }

  // Reset Password
  resetPassword() {
    if (this.resetPasswordForm.valid) {
      const newPassword = this.resetPasswordForm.get('newPassword')?.value;
      const confirmPassword =
        this.resetPasswordForm.get('confirmPassword')?.value;

      if (newPassword !== confirmPassword) {
        this.toastr.error('Passwords do not match', 'Error');
        return;
      }

      this.isLoading = true;
      const resetDto = {
        token: this.resetPasswordForm.get('token')?.value,
        newPassword: newPassword,
      };

      this.accountService.resetPassword(resetDto).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.accountService.clearLoggedUserFromStorage();
          this.toastr.success(response.message, 'Password Reset');
          this.showResetPassword = false;
          this.resetPasswordForm.reset();
          // Show login form/modal
          this.showForgotPassword = false;
          this.showForgotUsername = false;
          this.showResendConfirmation = false;
          this.showResetPassword = false;
          // Optionally, set a flag to show login form if needed
          // this.showLoginForm();
        },
        error: (error) => {
          console.error('Failed to reset password:', error);
          this.isLoading = false;
          this.toastr.error('Failed to reset password', 'Error');
        },
      });
    }
  }

  private handleLoginSuccess(response: any) {
    // Save logged user data to local storage
    if (response.username && response.token) {
      const loggedUser: LoggedUser = {
        id: 0, // Will be decoded from token by account service
        username: response.username,
        token: response.token,
        refreshToken: response.refreshToken || '',
        role: response.role || 'User',
        tokenExpires: response.tokenExpires
          ? new Date(response.tokenExpires)
          : undefined,
        refreshTokenExpires: response.refreshTokenExpires
          ? new Date(response.refreshTokenExpires)
          : undefined,
      };
      this.accountService.saveLoggedUserToStorageSync(loggedUser);
    }

    // Show success message
    this.toastr.success(
      `Welcome back, ${response.username}!`,
      'Login Successful',
      {
        timeOut: 6000,
        closeButton: true,
        progressBar: true,
      }
    );

    // Clear the login form
    this.loginForm.reset();

    // Emit success event
    this.loginSuccess.emit(response);

    // Close modal
    this.closeModal.emit();
  }

  private handleLoginError(error: any) {
    // Handle ban response from backend using unified method
    if (error.error?.error === 'USER_BANNED') {
      this.accountService.handleBackendBanResponse(error.error);
    } else if (error.error?.error === 'EMAIL_NOT_CONFIRMED') {
      this.toastr.error(error.error.message, 'Email Not Confirmed', {
        timeOut: 8000,
        closeButton: true,
        progressBar: true,
      });
      this.showResendConfirmation = true;
      this.resendConfirmationForm.patchValue({ email: error.error.email });
    } else if (error.error?.error === 'EMAIL_ALREADY_EXISTS') {
      this.toastr.error(error.error.message, 'Email Already Exists', {
        timeOut: 8000,
        closeButton: true,
        progressBar: true,
      });
    } else {
      this.toastr.error(
        'Login failed. Please check your credentials.',
        'Login Failed',
        {
          timeOut: 8000,
          closeButton: true,
          progressBar: true,
        }
      );
    }

    // Reset the login form
    this.loginForm.reset();
  }

  // Navigation methods
  showForgotPasswordForm() {
    this.showForgotPassword = true;
    this.showForgotUsername = false;
    this.showResendConfirmation = false;
    this.showResetPassword = false;
  }

  showForgotUsernameForm() {
    this.showForgotUsername = true;
    this.showForgotPassword = false;
    this.showResendConfirmation = false;
    this.showResetPassword = false;
  }

  showResendConfirmationForm() {
    this.showResendConfirmation = true;
    this.showForgotPassword = false;
    this.showForgotUsername = false;
    this.showResetPassword = false;
  }

  backToLogin() {
    this.showForgotPassword = false;
    this.showForgotUsername = false;
    this.showResendConfirmation = false;
    this.showResetPassword = false;
    this.loginForm.reset();

    // Clear reset token state
    this.resetToken = '';
    this.resetPasswordForm.reset();
  }

  close() {
    this.closeModal.emit();
  }

  // Method to be called when the login form becomes visible
  onLoginFormVisible() {
    // Force Google button to render after modal is visible
    setTimeout(() => {
      this.renderGoogleButton();
    }, 0); // Reduced delay for faster button appearance
  }

  private initializeGoogleSignIn() {
    // Wait for Google Sign-In library to load
    const checkGoogleLoaded = () => {
      if (
        typeof (window as any).google !== 'undefined' &&
        (window as any).google.accounts &&
        (window as any).google.accounts.id
      ) {
        // Initialize Google Sign-In
        (window as any).google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: this.handleGoogleSignIn.bind(this),
        });

        // Render the button when the form becomes visible
        this.renderGoogleButton();
      } else {
        // Check again in 100ms
        setTimeout(checkGoogleLoaded, 100);
      }
    };

    checkGoogleLoaded();
  }

  private renderGoogleButton() {
    const googleButton = document.getElementById('google-signin-button');
    if (googleButton && typeof (window as any).google !== 'undefined') {
      // Clear any existing content
      googleButton.innerHTML = '';

      try {
        // Check if dark theme is active
        const isDarkTheme = document.body.classList.contains('dark-theme');

        (window as any).google.accounts.id.renderButton(googleButton, {
          type: 'standard',
          size: 'large',
          theme: isDarkTheme ? 'filled_blue' : 'outline', // Use filled_blue for dark mode
          text: 'sign_in_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        });
      } catch (error) {
        console.warn('Failed to render Google button:', error);
        // Google button rendering failed
      }
    }
  }
}
