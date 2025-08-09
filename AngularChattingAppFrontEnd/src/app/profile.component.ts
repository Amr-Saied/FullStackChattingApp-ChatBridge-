import {
  Component,
  OnInit,
  ViewChild,
  HostListener,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthGuard } from '../_guards/auth.guard';
import { MemberService } from '../_services/member.service';
import { Member, PhotoDTO } from '../_models/member';
import { AccountService } from '../_services/account.service';
import {
  GalleryModule,
  GalleryItem,
  ImageItem,
  GalleryComponent,
} from 'ng-gallery';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerModule } from 'ngx-spinner';
import { DragDropDirective } from '../_directives/drag-drop.directive';
import { PhotoViewerComponent } from '../photo-viewer/photo-viewer.component';
import { DefaultPhotoService } from '../_services/default-photo.service';
import { StateService } from '../_services/state.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    GalleryModule,
    NgxSpinnerModule,
    DragDropDirective,
    PhotoViewerComponent,
  ],
  template: `
    <div class="profile-container">
      <div class="profile-banner">
        <img
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80"
          alt="Profile Banner"
          class="img-fluid profile-banner-img"
        />
      </div>

      <div class="profile-content-wrapper">
        <div class="profile-card main-card shadow-sm mx-auto">
          <div class="profile-header">
            <div class="profile-photo-wrapper">
              <img
                [src]="getProfileImageUrl(user.photoUrl)"
                alt="Profile Photo"
                class="profile-photo shadow"
              />
            </div>

            <div class="profile-info text-center text-md-start">
              <h2 class="display-6 fw-bold mb-1 profile-name">
                {{ user.knownAs || user.userName }}
              </h2>
              <div class="profile-meta mb-3">
                @if (user.city) {
                <span class="d-block d-md-inline-block me-md-3">
                  <i class="fas fa-map-marker-alt me-1"></i>{{ user.city }}
                </span>
                } @if (user.country) {
                <span class="d-block d-md-inline-block me-md-3">
                  <i class="fas fa-flag me-1"></i>{{ user.country }}
                </span>
                } @if (user.age) {
                <span class="d-block d-md-inline-block me-md-3">
                  <i class="fas fa-birthday-cake me-1"></i>{{ user.age }} yrs
                </span>
                } @if (user.gender) {
                <span class="d-block d-md-inline-block">
                  <i class="fas fa-venus-mars me-1"></i>{{ user.gender }}
                </span>
                }
              </div>
              <div
                class="d-flex flex-wrap justify-content-center justify-content-md-start gap-2 mb-3"
              >
                <button class="btn btn-main btn-sm" (click)="editProfile()">
                  <i class="fas fa-edit me-1"></i>Edit Profile
                </button>
              </div>
            </div>
          </div>

          <hr class="my-4" />

          <!-- Tab Navigation -->
          <ul class="nav nav-tabs profile-tabs" id="profileTabs" role="tablist">
            <li class="nav-item" role="presentation">
              <button
                class="nav-link profile-tab-btn"
                [class.active]="activeTab === 'about'"
                (click)="setTab('about')"
                type="button"
                role="tab"
              >
                <i class="fas fa-info-circle me-2"></i>About
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button
                class="nav-link profile-tab-btn"
                [class.active]="activeTab === 'interests'"
                (click)="setTab('interests')"
                type="button"
                role="tab"
              >
                <i class="fas fa-heart me-2"></i>Interests
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button
                class="nav-link profile-tab-btn"
                [class.active]="activeTab === 'looking-for'"
                (click)="setTab('looking-for')"
                type="button"
                role="tab"
              >
                <i class="fas fa-search me-2"></i>Looking For
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button
                class="nav-link profile-tab-btn"
                [class.active]="activeTab === 'gallery'"
                (click)="setTab('gallery')"
                type="button"
                role="tab"
              >
                <i class="fas fa-images me-2"></i>Gallery
              </button>
            </li>
          </ul>

          <!-- Tab Content -->
          <div class="tab-content" id="profileTabContent">
            <!-- About Tab -->
            <div
              class="tab-pane fade"
              [class.show]="activeTab === 'about'"
              [class.active]="activeTab === 'about'"
              role="tabpanel"
            >
              <div class="p-4">
                <h4 class="fw-bold mb-3">About Me</h4>
                <div class="about-content">
                  <p
                    class="mb-0 text-break"
                    [innerHTML]="
                      user.introduction || 'No introduction provided yet.'
                    "
                  ></p>
                </div>
              </div>
            </div>

            <!-- Interests Tab -->
            <div
              class="tab-pane fade"
              [class.show]="activeTab === 'interests'"
              [class.active]="activeTab === 'interests'"
              role="tabpanel"
            >
              <div class="p-4">
                <h4 class="fw-bold mb-3">Interests</h4>
                <div class="interests-content">
                  <p class="mb-0 text-break">
                    {{ user.interests || 'No interests listed yet.' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Looking For Tab -->
            <div
              class="tab-pane fade"
              [class.show]="activeTab === 'looking-for'"
              [class.active]="activeTab === 'looking-for'"
              role="tabpanel"
            >
              <div class="p-4">
                <h4 class="fw-bold mb-3">Looking For</h4>
                <div class="looking-for-content">
                  <p class="mb-0 text-break">
                    {{ user.lookingFor || 'No preferences listed yet.' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Gallery Tab -->
            <div
              class="tab-pane fade"
              [class.show]="activeTab === 'gallery'"
              [class.active]="activeTab === 'gallery'"
              role="tabpanel"
            >
              <div class="p-4">
                <!-- Gallery Header with Text and Controls -->
                <div class="gallery-header">
                  <div class="gallery-title">
                    <h4 class="fw-bold mb-0">Photo Gallery</h4>
                  </div>
                  <div class="gallery-controls">
                    <label class="btn btn-main btn-sm">
                      <i class="fas fa-plus me-1"></i>Add Photo
                      <input
                        type="file"
                        accept="image/*"
                        (change)="onGalleryPhotoSelected($event)"
                        hidden
                      />
                    </label>
                    <button
                      class="btn btn-outline-danger btn-sm"
                      (click)="toggleEditGallery()"
                    >
                      <i class="fas fa-trash me-1"></i
                      >{{ editGalleryMode ? 'Done' : 'Delete' }}
                    </button>
                  </div>
                </div>

                <!-- Drag and Drop Zone -->
                <div
                  appDragDrop
                  (filesDropped)="onFilesDropped($event)"
                  (dragEnter)="onDragEnter()"
                  (dragLeave)="onDragLeave()"
                  class="drag-drop-zone"
                  [class.show]="showDragZone"
                  [class.drag-over]="isDragOver"
                >
                  <div class="drag-drop-content">
                    <i class="fas fa-cloud-upload-alt drag-drop-icon"></i>
                    <p class="drag-drop-text">
                      Drag and drop photos here or click "Add Photo" above
                    </p>
                  </div>
                </div>

                <!-- Gallery with photos -->
                @if (user.photos && user.photos.length > 0) {
                <div class="gallery-wrapper">
                  <gallery
                    #galleryComp
                    [items]="galleryImages"
                    [thumbPosition]="'bottom'"
                    [nav]="true"
                    [autoplay]="true"
                  ></gallery>
                </div>
                }

                <!-- Empty gallery state -->
                @if (!user.photos || user.photos.length === 0) {
                <div class="empty-gallery">
                  <div class="empty-gallery-content">
                    <i class="fas fa-images empty-gallery-icon"></i>
                    <h4 class="empty-gallery-title">No Photos Yet</h4>
                    <p class="empty-gallery-message">
                      You haven't added any photos to your gallery yet. Click
                      "Add Photo" above to get started!
                    </p>
                  </div>
                </div>
                }

                <!-- Gallery View Mode (with View buttons) -->
                @if (!editGalleryMode && user.photos && user.photos.length > 0)
                {
                <div class="gallery-wrapper view-mode">
                  <div class="row g-2">
                    @for (photo of user.photos; track photo.id; let i = $index)
                    {
                    <div class="col-3 col-md-2">
                      <div class="position-relative photo-item">
                        <img
                          [src]="photo.url"
                          class="img-fluid rounded shadow"
                          style="width:100%;height:100px;object-fit:cover;cursor:pointer;"
                          (click)="openPhotoViewer(i)"
                        />
                        <button
                          class="btn btn-primary btn-sm photo-view-btn"
                          (click)="openPhotoViewer(i)"
                          title="View Photo"
                        >
                          <i class="fas fa-eye"></i>
                        </button>
                      </div>
                    </div>
                    }
                  </div>
                </div>
                }

                <!-- Gallery Edit Mode (with Delete buttons) -->
                @if (editGalleryMode && user.photos && user.photos.length > 0) {
                <div class="gallery-wrapper edit-mode">
                  <div class="row g-2">
                    @for (photo of user.photos; track photo.id; let i = $index)
                    {
                    <div class="col-3 col-md-2">
                      <div class="position-relative">
                        <img
                          [src]="photo.url"
                          class="img-fluid rounded shadow"
                          style="width:100%;height:100px;object-fit:cover;"
                        />
                        <button
                          class="btn btn-primary btn-sm position-absolute top-0 start-0 m-1"
                          (click)="openPhotoViewer(i)"
                          title="View Photo"
                        >
                          <i class="fas fa-eye"></i>
                        </button>
                        <button
                          class="btn btn-danger btn-sm position-absolute top-0 end-0 m-1"
                          (click)="deletePhoto(photo.id)"
                        >
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    }
                  </div>
                </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Photo Viewer Modal -->
    <app-photo-viewer
      [isOpen]="showPhotoViewer"
      [photos]="user.photos || []"
      [currentIndex]="photoViewerIndex"
      (closed)="closePhotoViewer()"
    >
    </app-photo-viewer>
  `,
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  user: Member = {
    id: 1,
    dateOfBirth: new Date(),
    created: new Date(),
    lastActive: new Date(),
    userName: 'GuestUser',
    knownAs: 'Guest',
    photoUrl: '',
    city: 'Cairo',
    age: 25,
    gender: 'Female',
    introduction: '',
    interests: '',
    lookingFor: '',
    photos: [
      {
        id: 1,
        url: 'https://randomuser.me/api/portraits/women/1.jpg',
        isMain: true,
      },
      {
        id: 2,
        url: 'https://randomuser.me/api/portraits/women/2.jpg',
        isMain: false,
      },
    ],
  };

  galleryImages: GalleryItem[] = [];
  editGalleryMode = false;
  activeTab: string = 'about';
  isDragOver: boolean = false;
  showDragZone: boolean = false;
  showPhotoViewer: boolean = false;
  photoViewerIndex: number = 0;
  @ViewChild(GalleryComponent) galleryComp?: GalleryComponent;

  private stateSubscription = new Subscription();

  constructor(
    private router: Router,
    private memberService: MemberService,
    private accountService: AccountService,
    private http: HttpClient,
    private toastr: ToastrService,
    private defaultPhotoService: DefaultPhotoService,
    private stateService: StateService
  ) {}

  ngOnInit() {
    // Subscribe to state changes for reactive updates
    this.stateSubscription.add(
      this.stateService.currentUser$.subscribe((user) => {
        if (user) {
          // Always update the user data when state changes
          this.user = { ...user };
          this.initGallery();

          // Force change detection
          setTimeout(() => {
            this.user = { ...user };
            this.initGallery();
          }, 0);
        }
      })
    );

    // Subscribe to general state changes
    this.stateSubscription.add(
      this.stateService.state$.subscribe((state) => {
        if (state.isProfileUpdated && state.currentUser) {
          this.user = { ...state.currentUser };
          this.initGallery();
        }
      })
    );

    const loggedUser = this.accountService.getLoggedUserFromStorageSync();
    if (loggedUser && loggedUser.id) {
      this.memberService.getMemberById(loggedUser.id).subscribe({
        next: (member) => {
          this.user = member;
          this.initGallery();

          // Update the state service with the loaded user
          this.stateService.updateCurrentUser(member);
        },
        error: (err) => {
          console.error('Error fetching member data:', err);
          this.toastr.error('Failed to load profile.');
        },
      });
    } else {
      this.initGallery();
    }
  }

  ngOnDestroy() {
    this.stateSubscription.unsubscribe();
  }

  setTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'gallery' && this.galleryComp) {
      // Force gallery to update its size/layout
      setTimeout(() => {
        if (this.galleryComp && (this.galleryComp as any).updateLayout) {
          (this.galleryComp as any).updateLayout();
        }
      }, 50);
    }
  }

  initGallery() {
    this.galleryImages = (this.user.photos || []).map(
      (photo) => new ImageItem({ src: photo.url, thumb: photo.url })
    );
  }

  getProfileImageUrl(photoUrl: string | undefined): string {
    return this.defaultPhotoService.getProfileImageUrl(photoUrl);
  }

  editProfile() {
    this.router.navigate(['/edit-profile']);
  }

  toggleEditGallery() {
    this.editGalleryMode = !this.editGalleryMode;
  }

  onGalleryPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      this.http
        .post<{ url: string }>(
          environment.apiUrl + 'Users/upload-photo',
          formData
        )
        .subscribe({
          next: (res) => {
            // Persist the photo in the backend gallery
            this.http
              .post(environment.apiUrl + 'Users/AddPhoto/' + this.user.id, {
                url: res.url,
              })
              .subscribe({
                next: () => {
                  // Reload user data to refresh gallery
                  this.memberService
                    .getMemberByUsername(this.user.userName!)
                    .subscribe({
                      next: (member) => {
                        this.user = member;
                        this.initGallery();
                      },
                    });
                },
              });
          },
          error: () => {
            this.toastr.error('Failed to upload photo.');
          },
        });
    }
  }

  deletePhoto(photoId: number) {
    if (!this.user.id) return;
    this.memberService.deletePhoto(this.user.id, photoId).subscribe({
      next: () => {
        // Remove photo from local user object
        this.user.photos = this.user.photos?.filter((p) => p.id !== photoId);
        this.initGallery();
        this.toastr.success('Photo deleted successfully.');
      },
      error: (err) => {
        console.error('Failed to delete photo:', err);
        this.toastr.error('Failed to delete photo.');
      },
    });
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
      this.handleGalleryPhotoUpload(file);
    }
  }

  private handleGalleryPhotoUpload(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    this.http
      .post<{ url: string }>(
        environment.apiUrl + 'Users/upload-photo',
        formData
      )
      .subscribe({
        next: (res) => {
          // Persist the photo in the backend gallery
          this.http
            .post(environment.apiUrl + 'Users/AddPhoto/' + this.user.id, {
              url: res.url,
            })
            .subscribe({
              next: () => {
                // Reload user data to refresh gallery
                this.memberService
                  .getMemberByUsername(this.user.userName!)
                  .subscribe({
                    next: (member) => {
                      this.user = member;
                      this.initGallery();
                      this.toastr.success('Photo uploaded successfully!');
                    },
                  });
              },
            });
        },
        error: () => {
          this.toastr.error('Failed to upload photo.');
        },
      });
  }

  @HostListener('document:dragenter', ['$event'])
  onDocumentDragEnter(event: DragEvent) {
    // Only show if we're on the gallery tab and dragging files
    if (
      this.activeTab === 'gallery' &&
      event.dataTransfer?.types.includes('Files')
    ) {
      this.showDragZone = true;
    }
  }

  @HostListener('document:dragleave', ['$event'])
  onDocumentDragLeave(event: DragEvent) {
    // Hide when leaving the document
    if (!event.relatedTarget) {
      this.showDragZone = false;
    }
  }

  @HostListener('document:drop')
  onDocumentDrop() {
    this.showDragZone = false;
  }

  openPhotoViewer(photoIndex: number) {
    this.photoViewerIndex = photoIndex;
    this.showPhotoViewer = true;
  }

  closePhotoViewer() {
    this.showPhotoViewer = false;
  }
}
