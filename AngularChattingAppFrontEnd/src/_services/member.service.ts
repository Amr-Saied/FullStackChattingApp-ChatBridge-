import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { Member } from '../_models/member';
import { environment } from '../environments/environment';
import { PaginationParams, PagedResult } from '../_models/pagination';
import { withCache } from '@ngneat/cashew';
import { StateService } from './state.service';

@Injectable({ providedIn: 'root' })
export class MemberService {
  private baseUrl = environment.apiUrl + 'Users';
  private exploreMembersClicked$ = new Subject<void>();

  constructor(private http: HttpClient, private stateService: StateService) {}

  // Method to notify when Explore Members is clicked
  notifyExploreMembersClicked() {
    this.exploreMembersClicked$.next();
  }

  // Observable to listen for Explore Members clicks
  getExploreMembersClicked() {
    return this.exploreMembersClicked$.asObservable();
  }

  getMembers(): Observable<Member[]> {
    return this.http
      .get<Member[]>(this.baseUrl + '/GetUsers', {
        context: withCache({
          ttl: 2 * 60 * 1000, // 2 minutes
          key: 'members-list',
        }),
      })
      .pipe(
        tap((members) => {
          this.stateService.updateMembers(members);
        })
      );
  }

  getMemberById(id: number): Observable<Member> {
    return this.http.get<Member>(this.baseUrl + '/GetUserById/' + id, {
      context: withCache({
        ttl: 5 * 60 * 1000, // 5 minutes
        key: `member-${id}`,
      }),
    });
  }

  getMemberByUsername(username: string): Observable<Member> {
    return this.http
      .get<Member>(this.baseUrl + '/GetUserByUsername/' + username, {
        context: withCache({
          ttl: 5 * 60 * 1000, // 5 minutes
          key: `member-username-${username}`,
        }),
      })
      .pipe(
        tap((member) => {
          this.stateService.updateCurrentUser(member);
        })
      );
  }

  updateMember(id: number, member: Member): Observable<Member> {
    return this.http
      .put<Member>(this.baseUrl + '/UpdateUser/' + id, member)
      .pipe(
        tap((updatedMember) => {
          // Clear relevant caches to ensure immediate updates
          this.clearMemberCaches(id, member.userName);

          // Update state immediately
          this.stateService.updateMember(updatedMember);
          this.stateService.updateCurrentUser(updatedMember);

          // Force refresh all user-related data
          this.stateService.forceRefreshUserData(updatedMember);

          // Force a complete cache clear and state refresh
          setTimeout(() => {
            this.clearAllMemberCaches();
            this.stateService.forceRefreshUserData(updatedMember);
          }, 0);
        })
      );
  }

  private clearMemberCaches(userId: number, username?: string) {
    // Clear specific member caches
    try {
      const cacheManager = (this.http as any).cacheManager;
      if (cacheManager && typeof cacheManager.delete === 'function') {
        // Clear member by ID cache
        cacheManager.delete(`member-${userId}`);

        // Clear member by username cache if username is provided
        if (username) {
          cacheManager.delete(`member-username-${username}`);
        }

        // Clear members list cache to ensure updated data is shown
        cacheManager.delete('members-list');
      }
    } catch (error) {
      console.warn('Failed to clear member caches:', error);
    }
  }

  private clearAllMemberCaches() {
    // Clear all member-related caches
    try {
      const cacheManager = (this.http as any).cacheManager;
      if (cacheManager && typeof cacheManager.delete === 'function') {
        // Clear all member caches
        cacheManager.delete('members-list');

        // Clear all member-specific caches by pattern
        const cacheKeys = Object.keys(cacheManager.store || {});
        cacheKeys.forEach((key) => {
          if (key.startsWith('member-') || key.startsWith('members-')) {
            cacheManager.delete(key);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to clear all member caches:', error);
    }
  }

  uploadPhoto(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(
      this.baseUrl + '/upload-photo',
      formData
    );
  }

  deletePhoto(userId: number, photoId: number) {
    return this.http.delete(this.baseUrl + `/DeletePhoto/${userId}/${photoId}`);
  }

  getMembersPaged(
    paginationParams: PaginationParams
  ): Observable<PagedResult<Member>> {
    const params = new HttpParams()
      .set('pageNumber', paginationParams.pageNumber.toString())
      .set('pageSize', paginationParams.pageSize.toString());

    return this.http.get<PagedResult<Member>>(this.baseUrl + '/GetUsersPaged', {
      params,
      context: withCache({
        ttl: 2 * 60 * 1000, // 2 minutes
        key: `members-paged-${paginationParams.pageNumber}-${paginationParams.pageSize}`,
      }),
    });
  }

  searchMembers(searchTerm: string): Observable<Member[]> {
    const params = new HttpParams().set('searchTerm', searchTerm);
    return this.http.get<Member[]>(this.baseUrl + '/SearchUsers', { params });
  }

  getLastActiveStatus(
    userId: number
  ): Observable<{ lastActiveStatus: string }> {
    return this.http.get<{ lastActiveStatus: string }>(
      this.baseUrl + '/GetLastActiveStatus/' + userId
    );
  }

  checkUsernameAvailability(
    username: string
  ): Observable<{ isAvailable: boolean; username: string }> {
    return this.http.get<{ isAvailable: boolean; username: string }>(
      environment.apiUrl + 'Account/CheckUsernameAvailability/' + username
    );
  }

  updateUsername(
    currentUsername: string,
    newUsername: string
  ): Observable<{ message: string; newUsername: string }> {
    return this.http
      .post<{ message: string; newUsername: string }>(
        environment.apiUrl + 'Account/UpdateUsername',
        { currentUsername, newUsername }
      )
      .pipe(
        tap(() => {
          // Clear relevant caches when username is updated
          try {
            const cacheManager = (this.http as any).cacheManager;
            if (cacheManager && typeof cacheManager.delete === 'function') {
              cacheManager.delete(`member-username-${currentUsername}`);
              cacheManager.delete(`member-username-${newUsername}`);
              cacheManager.delete('members-list');

              // Clear all member-related caches
              this.clearAllMemberCaches();
            }
          } catch (error) {
            console.warn('Failed to clear username caches:', error);
          }
        })
      );
  }
}
