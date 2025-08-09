import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Member } from '../../_models/member';
import { MemberService } from '../../_services/member.service';
import { DefaultPhotoService } from '../../_services/default-photo.service';
import { LikesService } from '../../_services/likes.service';
import { ToastrService } from 'ngx-toastr';
import { AccountService } from '../../_services/account.service';
import { NavigationService } from '../../_services/navigation.service';
import {
  GalleryComponent,
  GalleryItem,
  ImageItem,
  GalleryModule,
} from 'ng-gallery';
import { NgxSpinnerModule } from 'ngx-spinner';
import { PhotoViewerComponent } from '../../photo-viewer/photo-viewer.component';

@Component({
  selector: 'app-member-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    GalleryModule,
    NgxSpinnerModule,
    PhotoViewerComponent,
  ],
  templateUrl: './member-detail.html',
  styleUrl: './member-detail.css',
})
export class MemberDetail implements OnInit {
  member?: Member;
  loading = true;
  activeTab: string = 'details';
  galleryImages: GalleryItem[] = [];
  showPhotoViewer: boolean = false;
  photoViewerIndex: number = 0;
  @ViewChild(GalleryComponent) galleryComp?: GalleryComponent;

  // Like-related properties
  isLiked: boolean = false;
  likeCount: number = 0;
  likeLoading: boolean = false;
  isOwnProfile: boolean = false;

  // Track where user came from for proper back navigation
  private previousPageForMessages = '/members'; // Default fallback

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private memberService: MemberService,
    private defaultPhotoService: DefaultPhotoService,
    private likesService: LikesService,
    private toastr: ToastrService,
    private accountService: AccountService,
    private navigationService: NavigationService,
    private location: Location
  ) {}

  ngOnInit() {
    // Detect where user came from for proper back navigation to messages
    this.detectPreviousPage();

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadMember(id);
    }
  }

  private detectPreviousPage() {
    // Try multiple methods to detect where user came from
    let previousUrl: string | null = null;

    // Method 1: Check router navigation
    const navigation = this.router.getCurrentNavigation();
    previousUrl = navigation?.previousNavigation?.finalUrl?.toString() || null;

    // Method 2: Check navigation service history as fallback
    if (!previousUrl) {
      previousUrl = this.navigationService.getPreviousPageFromHistory();
    }

    // Method 3: Check document referrer as last resort
    if (!previousUrl) {
      const referrer = document.referrer;
      if (referrer) {
        const url = new URL(referrer);
        previousUrl = url.pathname;
      }
    }

    // Determine the page based on the URL
    if (previousUrl) {
      if (previousUrl.includes('/lists')) {
        this.previousPageForMessages = '/lists';
      } else if (previousUrl.includes('/members')) {
        this.previousPageForMessages = '/members';
      }
      // If coming from other pages, keep default '/members'
    }
  }

  loadMember(id: number) {
    this.memberService.getMemberById(id).subscribe({
      next: (member) => {
        this.member = member;
        this.loading = false;
        this.initGallery();
        this.loadLikeData();
        this.checkIfOwnProfile();
      },
      error: () => {
        this.loading = false;
      },
    });
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
    this.galleryImages = (this.member?.photos || []).map(
      (photo) => new ImageItem({ src: photo.url, thumb: photo.url })
    );
  }

  getProfileImageUrl(photoUrl: string | undefined): string {
    return this.defaultPhotoService.getProfileImageUrl(photoUrl);
  }

  // Like-related methods
  private loadLikeData() {
    if (!this.member) return;

    this.checkLikeStatus();
    this.loadLikeCount();
  }

  private checkIfOwnProfile() {
    if (!this.member) return;
    this.isOwnProfile = this.accountService.isCurrentUser(this.member.id);
  }

  private checkLikeStatus() {
    if (!this.member) return;

    // Don't check like status for own profile
    if (this.isOwnProfile) {
      this.isLiked = false;
      return;
    }

    this.likesService.checkLike(this.member.id).subscribe({
      next: (hasLiked) => {
        this.isLiked = hasLiked;
        this.likesService.setLikeState(this.member!.id, hasLiked);
      },
      error: () => {
        this.isLiked = false;
      },
    });
  }

  private loadLikeCount() {
    if (!this.member) return;

    this.likesService.getUserLikeCounts(this.member.id).subscribe({
      next: (counts) => {
        this.likeCount = counts.likedByCount;
      },
      error: () => {
        this.likeCount = 0;
      },
    });
  }

  toggleLike() {
    if (!this.member || this.likeLoading || this.isOwnProfile) return;

    this.likeLoading = true;

    // Optimistic update
    const newLikeState = !this.isLiked;
    this.isLiked = newLikeState;
    this.likesService.setLikeState(this.member.id, newLikeState);

    if (newLikeState) {
      this.likesService.addLike(this.member.id).subscribe({
        next: (success) => {
          this.likeLoading = false;
          if (success) {
            // Refresh like count after successful like
            this.loadLikeCount();
          } else {
            // Revert optimistic update on failure
            this.isLiked = !newLikeState;
            this.likesService.setLikeState(this.member!.id, !newLikeState);
          }
        },
        error: (error) => {
          this.likeLoading = false;
          // Revert optimistic update on error
          this.isLiked = !newLikeState;
          this.likesService.setLikeState(this.member!.id, !newLikeState);

          // Handle self-like error
          if (error.type === 'self-like') {
            this.toastr.warning('You cannot like yourself');
          } else {
            this.toastr.error(
              'Failed to like user. Please try again.',
              'Error'
            );
          }
        },
      });
    } else {
      this.likesService.removeLike(this.member.id).subscribe({
        next: (success) => {
          this.likeLoading = false;
          if (success) {
            // Refresh like count after successful unlike
            this.loadLikeCount();
          } else {
            // Revert optimistic update on failure
            this.isLiked = !newLikeState;
            this.likesService.setLikeState(this.member!.id, !newLikeState);
          }
        },
        error: () => {
          this.likeLoading = false;
          // Revert optimistic update on error
          this.isLiked = !newLikeState;
          this.likesService.setLikeState(this.member!.id, !newLikeState);
          this.toastr.error(
            'Failed to unlike user. Please try again.',
            'Error'
          );
        },
      });
    }
  }

  // Cache is now handled by @ngneat/cashew in the service layer
  clearCache(): void {
    // Cache clearing is now handled automatically by the library
  }

  // Method to get cache info (useful for debugging)
  getCacheInfo(): { size: number; keys: number[] } {
    // Cache info is now managed by the library
    return { size: 0, keys: [] };
  }

  // Navigate to messages with this user
  sendMessage() {
    if (!this.member || this.isOwnProfile) return;

    // Use the detected previous page for proper back navigation
    this.navigationService.navigateToMessagesWithHistory(
      {
        userId: this.member.id,
        username: this.member.knownAs || this.member.userName,
      },
      this.previousPageForMessages
    );
  }

  openPhotoViewer(photoIndex: number) {
    this.photoViewerIndex = photoIndex;
    this.showPhotoViewer = true;
  }

  closePhotoViewer() {
    this.showPhotoViewer = false;
  }
}
