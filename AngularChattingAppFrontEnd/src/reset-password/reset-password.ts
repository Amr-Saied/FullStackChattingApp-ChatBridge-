import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AccountService } from '../_services/account.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  token: string = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.resetPasswordForm = this.fb.group(
      {
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(6),
            // Uncomment for stronger password validation
            // Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    const encodedToken = this.route.snapshot.queryParams['token'] || '';
    if (!encodedToken) {
      this.toastr.error('Invalid reset link', 'Error');
      this.router.navigate(['/']);
      return;
    }

    try {
      this.token = decodeURIComponent(encodedToken);
    } catch (error) {
      this.toastr.error('Invalid reset link', 'Error');
      this.router.navigate(['/']);
    }
  }

  passwordMatchValidator(g: FormGroup) {
    const newPassword = g.get('newPassword')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;

    if (!newPassword || !confirmPassword) {
      return null; // Let individual field validators handle this
    }

    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  // Check if form is valid for button enable/disable
  isFormValid(): boolean {
    const newPassword = this.resetPasswordForm.get('newPassword')?.value;
    const confirmPassword =
      this.resetPasswordForm.get('confirmPassword')?.value;

    return (
      newPassword &&
      confirmPassword &&
      newPassword.length >= 6 &&
      newPassword === confirmPassword
    );
  }

  getFieldError(fieldName: string): string {
    const field = this.resetPasswordForm.get(fieldName);
    if (field?.invalid && field?.touched) {
      if (field.errors?.['required']) {
        return `${
          fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
        } is required`;
      }
      if (field.errors?.['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `${
          fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
        } must be at least ${requiredLength} characters`;
      }
      if (field.errors?.['pattern']) {
        return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
      }
    }
    return '';
  }

  getFormError(): string {
    const form = this.resetPasswordForm;
    if (form.errors?.['mismatch'] && form.get('confirmPassword')?.touched) {
      return 'Passwords do not match';
    }
    return '';
  }

  goToLogin() {
    this.router.navigate(['/']);
  }

  onSubmit() {
    if (this.isFormValid()) {
      this.isLoading = true;
      const resetData = {
        Token: this.token,
        NewPassword: this.resetPasswordForm.get('newPassword')?.value,
      };

      this.accountService.resetPassword(resetData).subscribe({
        next: (response: any) => {
          this.isLoading = false; // Reset loading state
          this.accountService.clearLoggedUserFromStorage();
          this.toastr.success(
            response.message || 'Password reset successfully!',
            'Success',
            {
              timeOut: 5000,
              closeButton: true,
              progressBar: true,
            }
          );
          // Redirect to login page (or home with showLogin param)
          this.router.navigate(['/'], {
            replaceUrl: true,
            queryParams: { showLogin: true },
          });
        },
        error: (error) => {
          this.isLoading = false; // Reset loading state immediately
          let errorMessage = 'Password reset failed. Please try again.';

          if (error.error) {
            if (typeof error.error === 'string') {
              errorMessage = error.error;
            } else if (error.error.message) {
              errorMessage = error.error.message;
            }
          }

          // Check for specific error messages
          if (
            errorMessage.toLowerCase().includes('same as your current password')
          ) {
            this.toastr.error(
              'New password cannot be the same as your current password',
              'Invalid Password',
              {
                timeOut: 8000,
                closeButton: true,
                progressBar: true,
              }
            );
          } else if (
            errorMessage.toLowerCase().includes('invalid reset token')
          ) {
            this.toastr.error(
              'Invalid or expired reset link. Please request a new one.',
              'Invalid Link',
              {
                timeOut: 8000,
                closeButton: true,
                progressBar: true,
              }
            );
          } else {
            this.toastr.error(errorMessage, 'Reset Failed', {
              timeOut: 8000,
              closeButton: true,
              progressBar: true,
            });
          }
        },
        complete: () => {
          this.isLoading = false;
        },
      });
    } else {
      this.resetPasswordForm.markAllAsTouched();
    }
  }
}
