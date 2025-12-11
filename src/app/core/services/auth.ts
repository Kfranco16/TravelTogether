import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, lastValueFrom, map, Observable, tap } from 'rxjs';
import { environment } from '../../../environment/environment';
import { Iuser } from '../../interfaces/iuser';
import { HttpHeaders } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

type LoginPayload = { email: string; password: string };
type LoginResponse = { message: string; token: string; user: Iuser };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private TOKEN_KEY = 'tt_token';
  private USER_KEY = 'tt_user';

  private _user$ = new BehaviorSubject<Iuser | null>(this.readUserFromStorage());
  readonly user$ = this._user$.asObservable();

  private readUserFromStorage(): Iuser | null {
    const raw = localStorage.getItem(this.USER_KEY);
    try {
      return raw ? (JSON.parse(raw) as Iuser) : null;
    } catch {
      return null;
    }
  }

  private writeAuth(token: string, user: Iuser) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this._user$.next(user);
  }

  private clearAuth() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._user$.next(null);
  }

  async register(payload: {
    username: string;
    email: string;
    password: string;
    image?: string;
    phone?: string;
    bio?: string;
    interests?: string;
  }): Promise<LoginResponse> {
    const response = await lastValueFrom(
      this.http.post<LoginResponse>(`${environment.apiUrl}/users/register`, payload)
    );

    this.writeAuth(response.token, response.user);
    return response;
  }

  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await lastValueFrom(
      this.http.post<LoginResponse>(`${environment.apiUrl}/users/login`, payload)
    );

    this.writeAuth(response.token, response.user);
    return response;
  }

  setCurrentUser(user: Iuser) {
    localStorage.setItem('usuario', JSON.stringify(user));
    this._user$.next(user);
  }

  getUserById(id: number): Promise<Iuser | null> {
    const token = this.gettoken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    return lastValueFrom(
      this.http.get<Iuser>(`${environment.apiUrl}/users/${id}`, { headers }).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 404) {
            return of(null as any);
          }

          console.error('Error getUserById', id, error);
          return throwError(() => error);
        })
      )
    );
  }

  getUserRating(userId: number, token: string): Observable<number> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http
      .get<{ score: number }>(`${environment.apiUrl}/ratings/score/${userId}`, { headers })
      .pipe(map((resp) => resp.score));
  }

  async updateUser(id: number, data: Partial<Iuser>): Promise<Iuser> {
    const res = await lastValueFrom(
      this.http.put<{ message: string; user: Iuser }>(`${environment.apiUrl}/users/${id}`, data)
    );

    const updated = res.user;

    const token = this.gettoken();
    if (token) this.writeAuth(token, updated);

    return updated;
  }

  logout() {
    this.clearAuth();
    window.location.reload();
  }

  isAuth(): boolean {
    const keyUser = localStorage.getItem(this.USER_KEY);
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  gettoken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): Iuser | null {
    return this._user$.value ?? this.readUserFromStorage();
  }
}
