import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-buggy-componenet',
  standalone: true,
  templateUrl: './buggy-componenet.html',
  styleUrl: './buggy-componenet.css',
  imports: [],
})
export class BuggyComponenet {
  baseUrl = environment.apiUrl + 'Buggy/';

  constructor(private http: HttpClient, private router: Router) {}

  get400Error() {
    this.callBoth('bad-request');
  }
  get401Error() {
    this.callBoth('auth');
  }
  get404Error() {
    this.callBoth('not-found');
  }
  get500Error() {
    this.callBoth('server-error');
  }

  private callBoth(method: string) {
    this.http.get(this.baseUrl + method).subscribe({
      next: () => {},
      error: () => {},
    });
  }

  goAdmin() {
    this.router.navigate(['/admin']);
  }
}
