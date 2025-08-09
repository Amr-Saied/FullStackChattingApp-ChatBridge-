import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { PaginationParams, PagedResult } from '../_models/pagination';
import { Member } from '../_models/member';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  baseUrl: string = environment.apiUrl + 'Users';

  constructor(private http: HttpClient) {
    // Remove protocol logic, use environment.usersUrl
  }

  getUsers() {
    return this.http.get(this.baseUrl + '/GetUsers');
  }

  getUserById(id: number) {
    return this.http.get(this.baseUrl + '/GetUserById/' + id);
  }

  getUsersPaged(paginationParams: PaginationParams) {
    const params = new HttpParams()
      .set('pageNumber', paginationParams.pageNumber.toString())
      .set('pageSize', paginationParams.pageSize.toString());

    return this.http.get<PagedResult<Member>>(this.baseUrl + '/GetUsersPaged', {
      params,
    });
  }
}
