import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { MemberService } from '../../_services/member.service';
import { Member } from '../../_models/member';
import { MemberCard } from '../member-card/member-card';
import { NgxSpinnerModule } from 'ngx-spinner';
import { PaginationParams, PagedResult } from '../../_models/pagination';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { StateService } from '../../_services/state.service';

@Component({
  selector: 'app-member-list',
  standalone: true,
  imports: [CommonModule, MemberCard, NgxSpinnerModule, FormsModule],
  templateUrl: './member-list.html',
  styleUrl: './member-list.css',
})
export class MemberList implements OnInit, OnDestroy {
  @ViewChild('searchInput', { static: false }) searchInput!: ElementRef;

  members: Member[] = [];
  isLoaded = false;
  paginationParams: PaginationParams = { pageNumber: 1, pageSize: 8 };
  totalPages = 0;
  totalCount = 0;
  searchTerm = '';
  isSearching = false;
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private memberService: MemberService,
    private toastr: ToastrService,
    private router: Router,
    private stateService: StateService
  ) {}

  ngOnInit() {
    // Subscribe to state changes
    this.stateService.members$.subscribe((members) => {
      this.members = members;
    });

    // Clear search and load all members when component initializes
    this.clearSearchAndLoadAll();
    this.setupSearch();
    this.setupNavigationListener();
    this.setupServiceListener();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupServiceListener() {
    // Listen for Explore Members button clicks via service
    this.memberService
      .getExploreMembersClicked()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Clear search when Explore Members is clicked
        this.clearSearchAndLoadAll();
      });
  }

  setupNavigationListener() {
    // Listen for navigation to /members
    this.router.events
      .pipe(
        filter((event: any) => event instanceof NavigationEnd),
        filter((event: any) => event.url === '/members'),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Clear search when navigating to /members
        // Use setTimeout to ensure the component is fully loaded
        setTimeout(() => {
          this.clearSearchAndLoadAll();
        }, 0);
      });
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

    this.loadMembers();
  }

  performSearch() {
    if (!this.searchTerm.trim()) {
      this.loadMembers();
      return;
    }

    this.isSearching = true;
    this.memberService.searchMembers(this.searchTerm).subscribe({
      next: (members) => {
        this.members = members;
        this.isSearching = false;
        this.isLoaded = true;

        if (members.length === 0) {
          this.toastr.info('No members found matching your search criteria.');
        }
      },
      error: () => {
        this.isSearching = false;
        this.isLoaded = true;
        this.toastr.error('Failed to search members. Please try again.');
      },
    });
  }

  loadMembers() {
    this.memberService.getMembersPaged(this.paginationParams).subscribe({
      next: (response: PagedResult<Member>) => {
        this.members = response.items;
        this.totalPages = response.totalPages;
        this.totalCount = response.totalCount;
        this.isLoaded = true;
      },
      error: () => {
        this.isLoaded = true;
        this.toastr.error('Failed to load members. Please try again.');
      },
    });
  }

  onPageChanged(pageNumber: number) {
    if (this.searchTerm.trim()) {
      return; // Don't paginate when searching
    }
    this.paginationParams.pageNumber = pageNumber;
    this.loadMembers();
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

  // clearCache(): void {}
}
