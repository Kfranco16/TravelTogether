import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, tap } from 'rxjs';
import { environment } from '../../../environment/environment';

type LoginPayload = { email: string; password: string };
type RegisterPayload = {
  username: string;
  email: string;
  password: string;
  image?: string;
  phone?: string;
  bio?: string;
  interests?: string;
};
type User = {
  id: number;
  username: string;
  email: string;
  image?: string;
  phone?: string;
  bio?: string;
  interests?: string;
  role?: string;
};

type LoginResponse = { message: string; token: string; user: User };
type RegisterResponse = { message?: string; user: User };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private TOKEN_KEY = 'tt_token';
  private USER_KEY = 'tt_user';

  private _user$ = new BehaviorSubject<User | null>(this.readUserFromStorage());
  readonly user$ = this._user$.asObservable();

  //almacenamiento de ayuda
  private readUserFromStorage(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);
    try {
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
  private writeAuth(token: string, user: User) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this._user$.next(user);
  }
  private clearAuth() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._user$.next(null);
  }

  //API
  login(payload: LoginPayload) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/users/login`, payload)
      .pipe(tap((res) => this.writeAuth(res.token, res.user)));
  }

  register(payload: RegisterPayload) {
    return this.http
      .post<RegisterResponse>(`${environment.apiUrl}/users/register`, payload)
      .pipe(map((res) => res.user));
  }

  logout() {
    this.clearAuth();
  }

  //estado simple
  isAuth(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }
  gettoken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
}
/* export class AuthService {
  login(token: string): void {
    localStorage.setItem('authToken', token);
  }
} */
