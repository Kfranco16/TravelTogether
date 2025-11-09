import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, lastValueFrom, map, tap } from 'rxjs';
import { environment } from '../../../environment/environment';
import { Iuser } from '../../interfaces/iuser';

type LoginPayload = { email: string; password: string };
type LoginResponse = { message: string; token: string; user: Iuser };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private TOKEN_KEY = 'tt_token';
  private USER_KEY = 'tt_user';

  private _user$ = new BehaviorSubject<Iuser | null>(this.readUserFromStorage());
  readonly user$ = this._user$.asObservable();

  // Lee el usuario guardado al iniciar
  private readUserFromStorage(): Iuser | null {
    const raw = localStorage.getItem(this.USER_KEY);
    try {
      return raw ? (JSON.parse(raw) as Iuser) : null;
    } catch {
      return null;
    }
  }
  // Almacena token y usuario tras login
  private writeAuth(token: string, user: Iuser) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this._user$.next(user);
  }
  // Limpia el estado de auth
  private clearAuth() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._user$.next(null);
  }

  // --- API ---
  /** Login adaptado: POST, guarda token, usuario y BehaviorSubject */
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await lastValueFrom(
      this.http.post<LoginResponse>(`${environment.apiUrl}/users/login`, payload)
    );
    this.writeAuth(response.token, response.user);
    return response;
  }

  getUserById(id: number): Promise<Iuser> {
    return lastValueFrom(this.http.get<Iuser>(`${environment.apiUrl}/users/${id}`));
  }

  logout() {
    this.clearAuth();
  }

  // --- Estado autenticación ---
  isAuth(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  gettoken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
}
