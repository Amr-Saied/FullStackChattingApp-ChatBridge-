import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AccountService } from '../_services/account.service';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private accountService: AccountService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  canActivate(): boolean {
    const isLoggedIn = this.accountService.isLoggedIn();

    if (isLoggedIn) {
      return true;
    } else {
      this.toastr.warning('Please login to access this page');
      this.router.navigate(['/home']);
      return false;
    }
  }
}
