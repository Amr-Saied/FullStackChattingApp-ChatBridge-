import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Member } from '../../_models/member';
import { DefaultPhotoService } from '../../_services/default-photo.service';
import { MemberService } from '../../_services/member.service';
import { LikesService } from '../../_services/likes.service';
import { ToastrService } from 'ngx-toastr';
import { AccountService } from '../../_services/account.service';
import { Router } from '@angular/router';
import { NavigationService } from '../../_services/navigation.service';

@Component({
  selector: 'app-member-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './member-card.html',
  styleUrl: './member-card.css',
})
export class MemberCard implements OnInit {
  @Input() member!: Member;
  lastActiveStatus: string = '';
  isLiked: boolean = false;
  likeCount: number = 0;
  loading: boolean = false;
  isOwnProfile: boolean = false;

  constructor(
    private defaultPhotoService: DefaultPhotoService,
    private memberService: MemberService,
    private likesService: LikesService,
    private toastr: ToastrService,
    private accountService: AccountService,
    private router: Router,
    private navigationService: NavigationService
  ) {}

  ngOnInit() {
    this.checkIfOwnProfile();
    this.loadLastActiveStatus();
    this.checkLikeStatus();
    this.loadLikeCount();
  }

  getProfileImageUrl(photoUrl: string | undefined): string {
    return this.defaultPhotoService.getProfileImageUrl(photoUrl);
  }

  private checkIfOwnProfile() {
    this.isOwnProfile = this.accountService.isCurrentUser(this.member.id);
  }

  private loadLastActiveStatus() {
    this.memberService.getLastActiveStatus(this.member.id).subscribe({
      next: (response) => {
        this.lastActiveStatus = response.lastActiveStatus;
      },
      error: (error) => {
        console.error('Error loading last active status:', error);
        this.lastActiveStatus = 'Unknown';
      },
    });
  }

  private checkLikeStatus() {
    // Don't check like status for own profile
    if (this.isOwnProfile) {
      this.isLiked = false;
      return;
    }

    this.likesService.checkLike(this.member.id).subscribe({
      next: (hasLiked) => {
        this.isLiked = hasLiked;
        this.likesService.setLikeState(this.member.id, hasLiked);
      },
      error: () => {
        this.isLiked = false;
      },
    });
  }

  private loadLikeCount() {
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
    if (this.loading || this.isOwnProfile) return;

    this.loading = true;

    // Optimistic update
    const newLikeState = !this.isLiked;
    this.isLiked = newLikeState;
    this.likesService.setLikeState(this.member.id, newLikeState);

    if (newLikeState) {
      this.likesService.addLike(this.member.id).subscribe({
        next: (success) => {
          this.loading = false;
          if (success) {
            // Refresh like count after successful like
            this.loadLikeCount();
          } else {
            // Revert optimistic update on failure
            this.isLiked = !newLikeState;
            this.likesService.setLikeState(this.member.id, !newLikeState);
          }
        },
        error: (error) => {
          this.loading = false;
          // Revert optimistic update on error
          this.isLiked = !newLikeState;
          this.likesService.setLikeState(this.member.id, !newLikeState);

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
          this.loading = false;
          if (success) {
            // Refresh like count after successful unlike
            this.loadLikeCount();
          } else {
            // Revert optimistic update on failure
            this.isLiked = !newLikeState;
            this.likesService.setLikeState(this.member.id, !newLikeState);
          }
        },
        error: () => {
          this.loading = false;
          // Revert optimistic update on error
          this.isLiked = !newLikeState;
          this.likesService.setLikeState(this.member.id, !newLikeState);
          this.toastr.error(
            'Failed to unlike user. Please try again.',
            'Error'
          );
        },
      });
    }
  }

  sendMessage() {
    if (this.isOwnProfile) {
      this.toastr.warning('You cannot message yourself');
      return;
    }

    // Determine current page to set as previous page for back navigation
    const currentUrl = this.router.url;
    let previousPage = '/messages'; // Default fallback

    if (currentUrl.includes('/members')) {
      previousPage = '/members';
    } else if (currentUrl.includes('/lists')) {
      previousPage = '/lists';
    }

    // Navigate to messages page with the user ID and track previous page
    this.navigationService.navigateToMessagesWithHistory(
      {
        userId: this.member.id,
        username: this.member.userName,
      },
      previousPage
    );
  }
}
