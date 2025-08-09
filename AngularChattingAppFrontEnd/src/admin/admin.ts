import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AccountService } from '../_services/account.service';
import { User } from '../_models/user';
import { UsersService } from '../_services/users.service';
import { ThemeService } from '../_services/theme.service';
import { AdminService } from '../_services/admin.service';
import { AdminUser } from '../_models/admin-user';
import { EditUserData } from '../_models/edit-user-data';
import { BanUserData } from '../_models/ban-user-data';
import { LoadingService } from '../_services/loading.service';
import { PaginationParams } from '../_models/pagination';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css'],
})
export class AdminComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput', { static: false }) searchInput!: ElementRef;

  users: User[] = [];
  adminUsers: AdminUser[] = [];
  showUsers = false;
  loading = false;

  // Search and pagination properties
  searchTerm = '';
  searchSubject = new Subject<string>();
  destroy$ = new Subject<void>();
  isSearching = false;

  // Pagination properties
  paginationParams: PaginationParams = { pageNumber: 1, pageSize: 7 };
  totalPages = 0;
  totalCount = 0;

  // Edit user modal
  showEditModal = false;
  editingUser: AdminUser | null = null;
  editForm: EditUserData = {} as EditUserData;

  // Ban user modal
  showBanModal = false;
  banningUser: AdminUser | null = null;
  banForm: BanUserData = {
    userId: 0,
    banReason: '',
    banExpiryDate: '',
    isPermanentBan: false,
  };

  // Confirm delete modal
  showDeleteModal = false;
  deletingUser: AdminUser | null = null;

  constructor(
    private accountService: AccountService,
    private usersService: UsersService,
    private themeService: ThemeService,
    private adminService: AdminService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    // Check if user is admin when component loads
    this.checkAdminRole();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  checkAdminRole(): void {
    const user = this.accountService.getLoggedUserFromStorageSync();
    if (!user || user.role !== 'Admin') {
      // Redirect to home if not admin
      window.location.href = '/';
    }
  }

  toggleUsers(): void {
    if (!this.showUsers) {
      this.loadAdminUsers();
    }
    this.showUsers = !this.showUsers;
  }

  loadUsers(): void {
    this.loading = true;
    this.usersService.getUsers().subscribe({
      next: (users: any) => {
        this.users = users as User[];
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
        this.loading = false;
      },
    });
  }

  setupSearch(): void {
    this.searchSubject
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.searchTerm = searchTerm;
        this.performSearch();
      });
  }

  onSearchInput(event: any): void {
    const searchTerm = event.target.value;
    this.searchSubject.next(searchTerm);
  }

  clearSearchAndLoadAll(): void {
    this.searchTerm = '';
    this.paginationParams.pageNumber = 1;
    this.loadAdminUsers();
  }

  performSearch(): void {
    if (!this.searchTerm.trim()) {
      this.loadAdminUsers();
      return;
    }

    this.isSearching = true;
    this.adminService.searchUsers(this.searchTerm).subscribe({
      next: (users: AdminUser[]) => {
        this.adminUsers = users;
        this.isSearching = false;
        this.totalPages = 0; // No pagination for search results
        this.totalCount = users.length;
      },
      error: (error: any) => {
        console.error('Error searching users:', error);
        this.isSearching = false;
      },
    });
  }

  loadAdminUsers(): void {
    this.loading = true;
    this.adminService.getAllUsers(this.paginationParams).subscribe({
      next: (response: any) => {
        this.adminUsers = response.items;
        this.totalPages = response.totalPages;
        this.totalCount = response.totalCount;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading admin users:', error);
        this.loading = false;
      },
    });
  }

  onPageChanged(pageNumber: number): void {
    this.paginationParams.pageNumber = pageNumber;
    this.loadAdminUsers();
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

  // Edit User Methods
  openEditModal(user: AdminUser): void {
    this.editingUser = user;
    this.editForm = {
      id: user.id,
      userName: user.userName,
      knownAs: user.knownAs,
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
      gender: user.gender,
      introduction: user.introduction,
      lookingFor: user.lookingFor,
      interests: user.interests,
      city: user.city,
      country: user.country,
      role: user.role,
    };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingUser = null;
    this.editForm = {} as EditUserData;
  }

  saveUserEdit(): void {
    if (!this.editingUser) return;

    this.adminService.editUser(this.editingUser.id, this.editForm).subscribe({
      next: (updatedUser: AdminUser) => {
        const index = this.adminUsers.findIndex((u) => u.id === updatedUser.id);
        if (index !== -1) {
          this.adminUsers[index] = updatedUser;
        }
        this.closeEditModal();
      },
      error: (error: any) => {
        console.error('Error updating user:', error);
      },
    });
  }

  // Ban User Methods
  openBanModal(user: AdminUser): void {
    this.banningUser = user;
    this.banForm = {
      userId: user.id,
      banReason: '',
      banExpiryDate: '',
      isPermanentBan: false,
    };
    this.showBanModal = true;
  }

  closeBanModal(): void {
    this.showBanModal = false;
    this.banningUser = null;
    this.banForm = {
      userId: 0,
      banReason: '',
      banExpiryDate: '',
      isPermanentBan: false,
    };
  }

  banUser(): void {
    if (!this.banningUser) return;

    this.adminService.banUser(this.banningUser.id, this.banForm).subscribe({
      next: () => {
        if (this.banningUser) {
          this.banningUser.isBanned = true;
          this.banningUser.banReason = this.banForm.banReason;
          this.banningUser.isPermanentBan = this.banForm.isPermanentBan;
          this.banningUser.banExpiryDate = this.banForm.banExpiryDate;
        }
        this.closeBanModal();
      },
      error: (error: any) => {
        console.error('Error banning user:', error);
      },
    });
  }

  unbanUser(user: AdminUser): void {
    this.adminService.unbanUser(user.id).subscribe({
      next: () => {
        user.isBanned = false;
        user.banReason = undefined;
        user.banExpiryDate = undefined;
        user.isPermanentBan = false;
      },
      error: (error: any) => {
        console.error('Error unbanning user:', error);
      },
    });
  }

  // Delete User Methods
  openDeleteModal(user: AdminUser): void {
    this.deletingUser = user;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deletingUser = null;
  }

  deleteUser(): void {
    if (!this.deletingUser) return;

    this.adminService.deleteUser(this.deletingUser.id).subscribe({
      next: () => {
        this.adminUsers = this.adminUsers.filter(
          (u) => u.id !== this.deletingUser?.id
        );
        this.closeDeleteModal();
      },
      error: (error: any) => {
        console.error('Error deleting user:', error);
      },
    });
  }

  // Utility Methods
  onPermanentBanChange(): void {
    if (this.banForm.isPermanentBan) {
      this.banForm.banExpiryDate = '';
    }
  }

  refreshBanStatus(): void {
    this.adminService.refreshBanStatus().subscribe({
      next: () => {
        this.loadAdminUsers();
      },
      error: (error: any) => {
        console.error('Error refreshing ban status:', error);
      },
    });
  }
}
