import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Iuser } from '../../interfaces/iuser';
import { lastValueFrom } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class Auth {
  private httpClient = inject(HttpClient);
  private baseUrl: string = 'http://localhost:3000/api/users/11';

  getUser(user: Iuser): Promise<Iuser | any> {
    return lastValueFrom(this.httpClient.get<Iuser>(this.baseUrl));
export class AuthService {
  login(token: string): void {
    localStorage.setItem('authToken', token);
  }
}
