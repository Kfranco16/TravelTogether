import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, lastValueFrom, map, tap } from 'rxjs';
import { environment } from '../../../environment/environment';
import { Iuser } from '../../interfaces/iuser';
import { HttpHeaders } from '@angular/common/http';

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

  // --- Registro ---
  /** Registro adaptado: POST, guarda token, usuario y BehaviorSubject */

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
    this.writeAuth(response.token, response.user); // Guarda token y usuario
    return response;
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
    const token = this.gettoken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return lastValueFrom(this.http.get<Iuser>(`${environment.apiUrl}/users/${id}`, { headers }));
  }

  // actualizar datos del usuario y refrescar el guardado
  async updateUser(id: number, data: Partial<Iuser>): Promise<Iuser> {
    const updated = await lastValueFrom(
      this.http.put<Iuser>(`${environment.apiUrl}/users/${id}`, data)
    );
    const token = this.gettoken();
    // guardamos de nuevo para que la app vea el nombre/foto actualizados en navbar/dashboard
    if (token) this.writeAuth(token, updated);
    return updated;
  }

  logout() {
    this.clearAuth();
    window.location.reload();
  }

  // --- Estado autenticación ---
  isAuth(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  gettoken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  //lectura “limpia” del usuario actual (útil en Dashboard, Perfil, etc.)
  getCurrentUser(): Iuser | null {
    return this._user$.value ?? this.readUserFromStorage();
  }
}
