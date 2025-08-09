import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { AdminUser } from '../_models/admin-user';
import { EditUserData } from '../_models/edit-user-data';
import { BanUserData } from '../_models/ban-user-data';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAllUsers(paginationParams?: any): Observable<any> {
    let params = {};
    if (paginationParams) {
      params = {
        pageNumber: paginationParams.pageNumber,
        pageSize: paginationParams.pageSize,
      };
    }
    return this.http.get<any>(`${this.baseUrl}Admin/GetAllUsers`, { params });
  }

  searchUsers(searchTerm: string): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.baseUrl}Admin/SearchUsers`, {
      params: { searchTerm },
    });
  }

  getUser(userId: number): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.baseUrl}Admin/GetUser/${userId}`);
  }

  editUser(userId: number, userData: EditUserData): Observable<AdminUser> {
    return this.http.put<AdminUser>(
      `${this.baseUrl}Admin/EditUser/${userId}`,
      userData
    );
  }

  banUser(userId: number, banData: BanUserData): Observable<any> {
    return this.http.post(`${this.baseUrl}Admin/BanUser/${userId}`, banData);
  }

  unbanUser(userId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}Admin/UnbanUser/${userId}`, {});
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}Admin/DeleteUser/${userId}`);
  }

  checkUserBanStatus(
    userId: number
  ): Observable<{ userId: number; isBanned: boolean }> {
    return this.http.get<{ userId: number; isBanned: boolean }>(
      `${this.baseUrl}Admin/CheckUserBanStatus/${userId}`
    );
  }

  refreshBanStatus(): Observable<any> {
    return this.http.post(`${this.baseUrl}Admin/RefreshBanStatus`, {});
  }
}
