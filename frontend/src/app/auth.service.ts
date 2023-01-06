import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { shareReplay, tap } from 'rxjs';
import { WebRequestService } from './web-request.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private webService: WebRequestService,
    private router: Router,
    private http: HttpClient
  ) {}

  signup(email: string, password: string) {
    console.log(email + password);
    return this.webService.signup(email, password).pipe(
      shareReplay(),
      tap((res: HttpResponse<any>) => {
        // The auth tokens will be in the header of this response
        let accessToken = res.headers.get('x-access-token') as string;
        let refreshToken = res.headers.get('x-refresh-token') as string;
        this.setSession(res.body._id, accessToken, refreshToken);
        console.log('Signed up and logged in!');
      })
    );
  }

  logIn(email: string, password: string) {
    return this.webService.login(email, password).pipe(
      shareReplay(),
      tap((res: HttpResponse<any>) => {
        // The auth tokens will be in the header of this response
        let accessToken = res.headers.get('x-access-token') as string;
        let refreshToken = res.headers.get('x-refresh-token') as string;
        this.setSession(res.body._id, accessToken, refreshToken);
        console.log('LOGGED IN: ');
      })
    );
  }

  logout() {
    this.removeSession();

    this.router.navigate(['/login']);
  }

  getUserId() {
    return localStorage.getItem('user-id');
  }

  getAccessToken() {
    return localStorage.getItem('x-access-token');
  }

  getRefreshToken() {
    return localStorage.getItem('x-refresh-token');
  }

  setRefreshToken(refreshToken: string) {
    localStorage.setItem('x-refresh-token', refreshToken);
  }

  setAccessToken(accessToken: string) {
    localStorage.setItem('x-access-token', accessToken);
  }

  private setSession(
    userId: string,
    accessToken: string,
    refreshToken: string
  ) {
    localStorage.setItem('user-id', userId);
    localStorage.setItem('x-access-token', accessToken);
    localStorage.setItem('x-refresh-token', refreshToken);
  }

  private removeSession() {
    localStorage.removeItem('user-id');
    localStorage.removeItem('x-access-token');
    localStorage.removeItem('x-refresh-token');
  }

  getNewAccessToken() {
    return this.http
      .get(`${this.webService.ROOT_URL}/users/me/access-token`, {
        headers: {
          'x-refresh-token': this.getRefreshToken() as string,
          _id: this.getUserId() as string,
        },
        observe: 'response',
      })
      .pipe(
        tap((res: HttpResponse<any>) => {
          this.setAccessToken(res.headers.get('x-access-token') as string);
        })
      );
  }
}
