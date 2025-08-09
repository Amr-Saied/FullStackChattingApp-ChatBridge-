import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MemberService } from '../_services/member.service';
import { Member } from '../_models/member';
import { AccountService } from '../_services/account.service';
import { ToastrService } from 'ngx-toastr';
import { TextInput } from '../_forms/text-input/text-input';
import { DefaultPhotoService } from '../_services/default-photo.service';
import { DragDropDirective } from '../_directives/drag-drop.directive';
import { ResponsiveService } from '../_services/responsive.service';
import { StateService } from '../_services/state.service';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  of,
} from 'rxjs';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TextInput, DragDropDirective],

  template: `
    <div class="profile-page-container container-fluid">
      <div
        class="profile-card main-card p-4 mx-auto"
        style="max-width: 900px; width: 100%;"
      >
        <h2
          class="text-center mb-4"
          style="color: #764ba2; letter-spacing: 1px;"
        >
          <i class="fas fa-user-edit me-2"></i>Edit Profile
        </h2>

        <!-- Username Change Section -->
        <div class="card mb-4" style="border: 1px solid #e9ecef;">
          <div class="card-header bg-light">
            <h5 class="mb-0"><i class="fas fa-at me-2"></i>Change Username</h5>
          </div>
          <div class="card-body">
            <form [formGroup]="usernameForm">
              <div class="row align-items-end">
                <div class="col-md-8">
                  <label class="form-label fw-bold">New Username</label>
                  <input
                    type="text"
                    class="form-control"
                    [class.is-invalid]="
                      usernameForm.get('newUsername')?.invalid &&
                      usernameForm.get('newUsername')?.touched
                    "
                    [class.is-valid]="
                      usernameForm.get('newUsername')?.valid &&
                      usernameForm.get('newUsername')?.value &&
                      usernameForm.get('newUsername')?.value !==
                        originalUsername
                    "
                    formControlName="newUsername"
                    placeholder="Enter new username (optional)"
                  />
                  <div
                    *ngIf="usernameForm.get('newUsername')?.errors?.['usernameTaken'] && usernameForm.get('newUsername')?.touched"
                    class="text-danger small mt-1"
                  >
                    <i class="fas fa-exclamation-triangle me-1"></i>Username is
                    already taken
                  </div>
                  <div
                    *ngIf="usernameForm.get('newUsername')?.errors?.['checking']"
                    class="text-info small mt-1"
                  >
                    <i class="fas fa-spinner fa-spin me-1"></i>Checking username
                    availability...
                  </div>
                  <div
                    *ngIf="
                      usernameForm.get('newUsername')?.valid &&
                      usernameForm.get('newUsername')?.value &&
                      usernameForm.get('newUsername')?.value !==
                        originalUsername &&
                      usernameForm.get('newUsername')?.touched
                    "
                    class="text-success small mt-1"
                  >
                    <i class="fas fa-check me-1"></i>Username is available
                  </div>
                  <div
                    *ngIf="usernameForm.get('newUsername')?.errors?.['minlength'] && usernameForm.get('newUsername')?.touched"
                    class="text-danger small mt-1"
                  >
                    <i class="fas fa-exclamation-triangle me-1"></i>Username
                    must be at least 3 characters
                  </div>
                </div>
                <div class="col-md-4">
                  <button
                    type="button"
                    class="btn btn-outline-primary w-100"
                    [disabled]="
                      (usernameForm.get('newUsername')?.invalid &&
                        usernameForm.get('newUsername')?.touched) ||
                      !hasUsernameChanged() ||
                      isUpdatingUsername
                    "
                    (click)="updateUsername()"
                  >
                    <i class="fas fa-save me-2" *ngIf="!isUpdatingUsername"></i>
                    <i
                      class="fas fa-spinner fa-spin me-2"
                      *ngIf="isUpdatingUsername"
                    ></i>
                    {{ isUpdatingUsername ? 'Updating...' : 'Update Username' }}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <!-- Profile Information Section -->
        <div class="card">
          <div class="card-header bg-light">
            <h5 class="mb-0">
              <i class="fas fa-user me-2"></i>Profile Information
            </h5>
          </div>
          <div class="card-body">
            <form
              *ngIf="member"
              [formGroup]="editForm"
              (ngSubmit)="onSubmit()"
              autocomplete="off"
            >
              <div class="row g-4">
                <div
                  class="col-12 col-md-4 d-flex flex-column align-items-center justify-content-start"
                >
                  <div
                    appDragDrop
                    (filesDropped)="onFilesDropped($event)"
                    (dragEnter)="onDragEnter()"
                    (dragLeave)="onDragLeave()"
                    class="profile-photo-container"
                    [class.drag-over]="isDragOver"
                  >
                    <img
                      [src]="getProfileImageUrl(member.photoUrl)"
                      class="profile-photo mb-3 shadow"
                      alt="Profile Photo"
                      style="width: 180px; height: 180px; object-fit: cover; border-radius: 50%; border: 6px solid #fff; box-shadow: 0 4px 24px rgba(102, 126, 234, 0.12);"
                    />
                    <div class="drag-overlay" *ngIf="isDragOver">
                      <i class="fas fa-cloud-upload-alt"></i>
                      <span>Drop photo here</span>
                    </div>
                  </div>
                  <div class="w-100" style="margin-top: 1rem;">
                    <label class="form-label fw-bold">Profile Photo</label>
                    <input
                      type="file"
                      class="form-control mb-2"
                      (change)="onFileSelected($event)"
                      accept="image/*"
                    />
                    <small class="text-muted"
                      >Or drag and drop a photo above</small
                    >
                  </div>
                </div>
                <div class="col-12 col-md-8">
                  <!-- Known As Field -->
                  <app-text-input
                    label="Known As"
                    fieldName="knownAs"
                    placeholder="Display name"
                    icon="fas fa-user"
                    [isRequired]="true"
                    formControlName="knownAs"
                  >
                  </app-text-input>

                  <!-- Introduction Field -->
                  <div class="mb-3">
                    <label class="form-label fw-bold">
                      <i class="fas fa-info-circle me-1"></i>About
                    </label>
                    <textarea
                      class="form-control"
                      formControlName="introduction"
                      rows="3"
                      placeholder="Tell us about yourself..."
                    ></textarea>
                  </div>

                  <div class="row">
                    <!-- Interests Field -->
                    <div class="col-12 col-md-6">
                      <app-text-input
                        label="Interests"
                        fieldName="interests"
                        placeholder="Your interests"
                        icon="fas fa-heart"
                        formControlName="interests"
                      >
                      </app-text-input>
                    </div>

                    <!-- Looking For Field -->
                    <div class="col-12 col-md-6">
                      <app-text-input
                        label="Looking For"
                        fieldName="lookingFor"
                        placeholder="What are you looking for?"
                        icon="fas fa-search"
                        formControlName="lookingFor"
                      >
                      </app-text-input>
                    </div>
                  </div>

                  <div class="row">
                    <!-- City Field -->
                    <div class="col-12 col-md-6">
                      <app-text-input
                        label="City"
                        fieldName="city"
                        placeholder="City"
                        icon="fas fa-map-marker-alt"
                        formControlName="city"
                      >
                      </app-text-input>
                    </div>

                    <!-- Country Field -->
                    <div class="col-12 col-md-6">
                      <app-text-input
                        label="Country"
                        fieldName="country"
                        placeholder="Country"
                        icon="fas fa-flag"
                        formControlName="country"
                      >
                      </app-text-input>
                    </div>
                  </div>

                  <div class="d-flex justify-content-end mt-4">
                    <button
                      class="btn btn-main px-4 py-2 w-100 w-md-auto"
                      type="submit"
                      [disabled]="
                        editForm.invalid ||
                        !hasFormChanges() ||
                        isUpdatingProfile
                      "
                      style="font-weight: 600; font-size: 1.1rem;"
                    >
                      <i
                        class="fas fa-save me-2"
                        *ngIf="!isUpdatingProfile"
                      ></i>
                      <i
                        class="fas fa-spinner fa-spin me-2"
                        *ngIf="isUpdatingProfile"
                      ></i>
                      {{
                        isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'
                      }}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div *ngIf="!member" class="text-center py-5">Loading...</div>
        <div *ngIf="successMsg" class="alert alert-success mt-3 text-center">
          {{ successMsg }}
        </div>
        <div *ngIf="errorMsg" class="alert alert-danger mt-3 text-center">
          {{ errorMsg }}
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../Members/member-detail/member-detail.css'],
})
export class EditProfileComponent implements OnInit, OnDestroy {
  member: Member | null = null;
  editForm: FormGroup;
  usernameForm: FormGroup;
  successMsg: string = '';
  errorMsg: string = '';
  isDragOver: boolean = false;
  originalUsername: string = '';
  isUpdatingUsername: boolean = false;
  isUpdatingProfile: boolean = false;
  private responsiveSubscription: Subscription = new Subscription();
  isMobile: boolean = false;
  isTablet: boolean = false;
  isDesktop: boolean = false;

  constructor(
    private memberService: MemberService,
    private accountService: AccountService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private defaultPhotoService: DefaultPhotoService,
    private responsiveService: ResponsiveService,
    private stateService: StateService
  ) {
    this.editForm = this.fb.group({
      knownAs: ['', [Validators.required]],
      introduction: [''],
      interests: [''],
      lookingFor: [''],
      city: [''],
      country: [''],
    });

    this.usernameForm = this.fb.group({
      newUsername: [
        '',
        [Validators.minLength(3)],
        [this.usernameAvailabilityValidator.bind(this)],
      ],
    });
  }

  originalMember: Member | null = null;

  ngOnInit() {
    // Initialize responsive state
    this.responsiveSubscription.add(
      this.responsiveService.getResponsiveState().subscribe((state) => {
        this.isMobile = state.isMobile;
        this.isTablet = state.isTablet;
        this.isDesktop = state.isDesktop;
      })
    );

    // Subscribe to state changes for reactive updates
    this.responsiveSubscription.add(
      this.stateService.currentUser$.subscribe((user) => {
        if (user && this.member && user.id === this.member.id) {
          this.member = { ...user };
          this.originalMember = { ...user };
          this.updateFormValues();
        }
      })
    );

    const loggedUser = this.accountService.getLoggedUserFromStorageSync();

    if (loggedUser && loggedUser.id) {
      this.memberService.getMemberById(loggedUser.id).subscribe({
        next: (member) => {
          if (!member) {
            this.toastr.error('User not found. Please check your login.');
            return;
          }
          this.member = { ...member };
          this.originalMember = { ...member };
          this.originalUsername = member.userName || '';
          this.updateFormValues();
        },
        error: (error) => {
          console.error('Error loading profile:', error);
          this.toastr.error(
            `Failed to load profile: ${error.message || 'Unknown error'}`
          );
        },
      });
    } else {
      this.toastr.error('User not found. Please log in again.');
    }
  }

  ngOnDestroy() {
    this.responsiveSubscription.unsubscribe();
  }

  usernameAvailabilityValidator(control: AbstractControl) {
    const username = control.value;
    if (!username || username === this.originalUsername) {
      return of(null);
    }

    return this.memberService.checkUsernameAvailability(username).pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap((response) => {
        if (!response.isAvailable) {
          return of({ usernameTaken: true });
        }
        return of(null);
      }),
      catchError(() => of(null))
    );
  }

  updateFormValues() {
    if (this.member) {
      this.editForm.patchValue({
        knownAs: this.member.knownAs || '',
        introduction: this.member.introduction || '',
        interests: this.member.interests || '',
        lookingFor: this.member.lookingFor || '',
        city: this.member.city || '',
        country: this.member.country || '',
      });
    }
  }

  hasFormChanges(): boolean {
    if (!this.originalMember) return false;

    const formValue = this.editForm.value;
    return (
      formValue.knownAs !== this.originalMember.knownAs ||
      formValue.introduction !== this.originalMember.introduction ||
      formValue.interests !== this.originalMember.interests ||
      formValue.lookingFor !== this.originalMember.lookingFor ||
      formValue.city !== this.originalMember.city ||
      formValue.country !== this.originalMember.country
    );
  }

  hasUsernameChanged(): boolean {
    const newUsername = this.usernameForm.get('newUsername')?.value;
    return newUsername && newUsername !== this.originalUsername;
  }

  updateUsername() {
    if (
      this.hasUsernameChanged() &&
      this.usernameForm.get('newUsername')?.valid
    ) {
      this.isUpdatingUsername = true;
      const newUsername = this.usernameForm.get('newUsername')?.value;

      this.memberService
        .updateUsername(this.originalUsername, newUsername)
        .subscribe({
          next: (response) => {
            this.toastr.success('Username updated successfully!');

            // Update the stored user data with new username and ensure session persistence
            const loggedUser =
              this.accountService.getLoggedUserFromStorageSync();
            if (loggedUser) {
              loggedUser.username = response.newUsername;
              // Use synchronous method to ensure immediate availability
              this.accountService.saveLoggedUserToStorageSync(loggedUser);

              // Refresh session to ensure persistence
              if (!this.accountService.refreshSession()) {
                this.toastr.error('Session expired. Please log in again.');
                return;
              }
            }

            // Reload member data with new username
            this.loadMemberData(response.newUsername);

            this.usernameForm.reset();
            this.isUpdatingUsername = false;

            // Force a complete state refresh to ensure all components update
            setTimeout(() => {
              this.stateService.forceRefreshUserData(this.member!);
            }, 0);
          },
          error: (error) => {
            console.error('Username update error:', error);
            this.toastr.error(error.error || 'Failed to update username.');
            this.isUpdatingUsername = false;
          },
        });
    }
  }

  private loadMemberData(username: string) {
    this.memberService.getMemberByUsername(username).subscribe({
      next: (member) => {
        if (!member) {
          this.toastr.error(
            `User '${username}' not found. Please refresh the page.`
          );
          return;
        }
        this.member = { ...member };
        this.originalMember = { ...member };
        this.originalUsername = member.userName || '';
        this.updateFormValues();

        // Force refresh all user-related data across the application
        this.stateService.forceRefreshUserData(member);

        // Force another update to ensure all components catch the change
        setTimeout(() => {
          this.stateService.forceRefreshUserData(member);
        }, 0);
      },
      error: (error) => {
        console.error('Error reloading member data:', error);
        this.toastr.error(
          `Failed to reload profile: ${error.message || 'Unknown error'}`
        );
      },
    });
  }

  onSubmit() {
    if (!this.member) {
      this.toastr.error('No member data available. Please refresh the page.');
      return;
    }

    if (this.editForm.valid && this.member) {
      if (!this.member.id) {
        this.toastr.error('Member ID is missing. Please refresh the page.');
        return;
      }

      this.isUpdatingProfile = true;
      const formValue = this.editForm.value;

      const updatedMember: Member = {
        ...this.member,
        knownAs: formValue.knownAs,
        introduction: formValue.introduction,
        interests: formValue.interests,
        lookingFor: formValue.lookingFor,
        city: formValue.city,
        country: formValue.country,
      };

      this.memberService.updateMember(this.member.id, updatedMember).subscribe({
        next: (updatedMember) => {
          // Immediately update local state
          this.member = { ...updatedMember };
          this.originalMember = { ...updatedMember };

          // Clear success/error messages
          this.successMsg = 'Profile updated successfully!';
          this.errorMsg = '';

          // Force refresh all user-related data across the application
          this.stateService.forceRefreshUserData(updatedMember);

          // Update the logged user in storage to reflect changes
          const loggedUser = this.accountService.getLoggedUserFromStorageSync();
          if (loggedUser && updatedMember.userName) {
            loggedUser.username = updatedMember.userName;
            this.accountService.saveLoggedUserToStorageSync(loggedUser);
          }

          // Refresh session to ensure persistence after profile update
          if (!this.accountService.refreshSession()) {
            this.toastr.error('Session expired. Please log in again.');
            return;
          }

          // Show success message
          this.toastr.success('Profile updated successfully!');

          // Reset form state
          this.isUpdatingProfile = false;

          // Update form values to reflect the new state
          this.updateFormValues();

          // Force a complete state refresh to ensure all components update
          setTimeout(() => {
            this.stateService.forceRefreshUserData(updatedMember);
          }, 0);
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.errorMsg = 'Failed to update profile.';
          this.successMsg = '';
          this.toastr.error('Failed to update profile.');
          this.isUpdatingProfile = false;
        },
      });
    }
  }

  getProfileImageUrl(photoUrl: string | undefined): string {
    return this.defaultPhotoService.getProfileImageUrl(photoUrl);
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      this.handlePhotoUpload(file);
    }
  }

  onDragEnter() {
    this.isDragOver = true;
  }

  onDragLeave() {
    this.isDragOver = false;
  }

  onFilesDropped(files: FileList) {
    if (files.length > 0) {
      const file = files[0]; // Take the first file
      this.handlePhotoUpload(file);
    }
  }

  private handlePhotoUpload(file: File) {
    this.memberService.uploadPhoto(file).subscribe({
      next: (res: { url: string }) => {
        if (this.member) {
          // Immediately update local state
          this.member.photoUrl = res.url;

          // Save the new photo URL to the backend
          this.memberService
            .updateMember(this.member.id, this.member)
            .subscribe({
              next: (updatedMember) => {
                // Update local state immediately
                this.member = { ...updatedMember };
                this.originalMember = { ...updatedMember };

                // Force refresh all user-related data across the application
                this.stateService.forceRefreshUserData(updatedMember);

                // Update the logged user in storage
                const loggedUser =
                  this.accountService.getLoggedUserFromStorageSync();
                if (loggedUser && updatedMember.userName) {
                  loggedUser.username = updatedMember.userName;
                  this.accountService.saveLoggedUserToStorageSync(loggedUser);
                }

                this.toastr.success('Profile photo updated successfully!');

                // Force a complete state refresh to ensure all components update
                setTimeout(() => {
                  this.stateService.forceRefreshUserData(updatedMember);
                }, 100);
              },
              error: (error) => {
                console.error('Error updating member with new photo:', error);
                this.toastr.error('Error updating profile photo');
              },
            });
        }
      },
      error: () => {
        this.toastr.error('Error uploading photo');
      },
    });
  }
}
