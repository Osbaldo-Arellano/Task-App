import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { List } from './models/list.model';

@Injectable({
  providedIn: 'root',
})
export class WebRequestService {
  readonly ROOT_URL;

  constructor(private http: HttpClient) {
    this.ROOT_URL = 'http://localhost:3000';
  }

  get(uri: string) {
    return this.http.get<any[]>(`${this.ROOT_URL}/${uri}`);
  }

  post(uri: string, payload: Object) {
    return this.http.post<any>(`${this.ROOT_URL}/${uri}`, payload);
  }

  patch(uri: string, payload: Object) {
    console.log('PAYLOAD: ' + payload);
    return this.http.patch<any[]>(`${this.ROOT_URL}/${uri}`, payload);
  }

  delete(uri: string) {
    return this.http.delete<any[]>(`${this.ROOT_URL}/${uri}`);
  }

  login(email: string, password: string) {
    return this.http.post(
      `${this.ROOT_URL}/users/login`,
      {
        email,
        password,
      },
      {
        observe: 'response',
      }
    );
  }

  signup(email: string, password: string) {
    return this.http.post(
      `${this.ROOT_URL}/users`,
      {
        email,
        password,
      },
      {
        observe: 'response',
      }
    );
  }
}
