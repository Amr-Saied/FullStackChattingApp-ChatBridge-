import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MemberCard } from '../Members/member-card/member-card';
import { Member } from '../_models/member';
import { LikesService } from '../_services/likes.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerModule } from 'ngx-spinner';
import { PaginationParams } from '../_models/pagination';
import { PagedResult } from '../_models/pagination';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-lists',
  imports: [
    CommonModule,
    RouterModule,
    MemberCard,
    NgxSpinnerModule,
    FormsModule,
  ],
  templateUrl: './lists.html',
  styleUrl: './lists.css',
})
export class Lists implements OnInit, OnDestroy {
  @ViewChild('searchInput', { static: false }) searchInput!: ElementRef;

  likedMembers: Member[] = [];
  allLikedMembers: Member[] = []; // Store all liked members for search filtering
  filteredMembers: Member[] = []; // Store filtered members for display
  isLoaded = false;
  paginationParams: PaginationParams = { pageNumber: 1, pageSize: 6 };
  totalPages = 0;
  totalCount = 0;
  searchTerm = '';
  isSearching = false;
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private likesService: LikesService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.clearSearchAndLoadAll();
    this.setupSearch();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupSearch() {
    this.searchSubject
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.searchTerm = searchTerm;
        this.performSearch();
      });
  }

  onSearchInput(event: any) {
    const searchTerm = event.target.value;
    this.searchSubject.next(searchTerm);
  }

  // Method to clear search and load all members
  clearSearchAndLoadAll() {
    this.searchTerm = '';
    this.isSearching = false;
    this.paginationParams.pageNumber = 1; // Reset to first page

    // Clear the search input field if it exists
    if (this.searchInput && this.searchInput.nativeElement) {
      this.searchInput.nativeElement.value = '';
    }

    this.loadLikedMembers();
  }

  performSearch() {
    if (!this.searchTerm.trim()) {
      // If no search term, show paginated results
      this.updatePaginatedDisplay();
      return;
    }

    this.isSearching = true;

    // Filter members based on search term (client-side search)
    const searchTermLower = this.searchTerm.toLowerCase();
    this.filteredMembers = this.allLikedMembers.filter(
      (member) =>
        member.knownAs?.toLowerCase().includes(searchTermLower) ||
        member.userName?.toLowerCase().includes(searchTermLower) ||
        member.city?.toLowerCase().includes(searchTermLower) ||
        member.country?.toLowerCase().includes(searchTermLower)
    );

    this.likedMembers = this.filteredMembers;
    this.isSearching = false;

    if (this.filteredMembers.length === 0) {
      this.toastr.info('No favourites found matching your search criteria.');
    }
  }

  loadLikedMembers() {
    this.isLoaded = false;

    // Load all liked members first (using large page size to get all)
    this.likesService
      .getMyLikesPaged(1, 1000) // Get all liked members
      .subscribe({
        next: (response: PagedResult<Member>) => {
          this.allLikedMembers = response.items;
          this.totalCount = response.totalCount;

          // Calculate pagination for the actual page size
          this.totalPages = Math.ceil(
            this.totalCount / this.paginationParams.pageSize
          );

          // Show paginated results
          this.updatePaginatedDisplay();
          this.isLoaded = true;

          if (response.totalCount === 0) {
            this.toastr.info("You haven't liked any members yet.");
          }
        },
        error: () => {
          this.isLoaded = true;
          this.toastr.error(
            'Failed to load your liked members. Please try again.'
          );
        },
      });
  }

  updatePaginatedDisplay() {
    const startIndex =
      (this.paginationParams.pageNumber - 1) * this.paginationParams.pageSize;
    const endIndex = startIndex + this.paginationParams.pageSize;
    this.likedMembers = this.allLikedMembers.slice(startIndex, endIndex);
  }

  onPageChanged(pageNumber: number) {
    if (this.searchTerm.trim()) {
      return; // Don't paginate when searching
    }
    this.paginationParams.pageNumber = pageNumber;
    this.updatePaginatedDisplay();
  }

  getPageNumbers(): number[] {
    if (this.searchTerm.trim()) {
      return []; // Don't show pagination when searching
    }

    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.paginationParams.pageNumber - 2);
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }
}
