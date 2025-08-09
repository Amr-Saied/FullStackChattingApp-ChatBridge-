import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AccountService } from '../_services/account.service';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanActivate {
  constructor(
    private accountService: AccountService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  canActivate(): boolean {
    if (this.accountService.isLoggedIn()) {
      const user = this.accountService.getLoggedUserFromStorageSync();
      if (user?.role === 'Admin') {
        return true;
      } else {
        this.toastr.error('Admin access required');
        this.router.navigate(['/home']);
        return false;
      }
    } else {
      this.toastr.error('Admins only!');
      this.router.navigate(['/home']);
      return false;
    }
  }
}
