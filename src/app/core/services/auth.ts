import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, lastValueFrom, map, tap } from 'rxjs';
import { environment } from '../../../environment/environment';
import { Iuser } from '../../interfaces/iuser';

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

type userlogin = { email: string; password: string };

type LoginResponse = { message: string; token: string; user: Iuser };
type RegisterResponse = { message?: string; user: Iuser };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private TOKEN_KEY = 'tt_token';
  private USER_KEY = 'tt_user';

  private _user$ = new BehaviorSubject<Iuser | null>(this.readUserFromStorage());
  readonly user$ = this._user$.asObservable();

  //stream booleano para que el navbar reaccione sin preguntar a localStorage cada vez
  readonly isAuth$ = this.user$.pipe(map((u) => !!u));

  //almacenamiento de ayuda
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

  //API
  /*  login(payload: LoginPayload) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/users/login`, payload)
      .pipe(tap((res) => this.writeAuth(res.token, res.user)));
  } */

  //dejamos tu versión en Promise tal cual para no romper llamadas existentes
  login(user: userlogin): Promise<LoginResponse | undefined> {
    return lastValueFrom(this.http.post<any>(`${environment.apiUrl}/users/login`, user));
  }

  //alternativa observable por si preferimos reactivar el flujo reactivo más adelante
  login$(payload: LoginPayload) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/users/login`, payload)
      .pipe(tap((res) => this.writeAuth(res.token, res.user)));
  }

  //helper por si ya tienes el response en alguna parte y sólo quieres reflejar login en el estado
  applyLogin(res: LoginResponse) {
    this.writeAuth(res.token, res.user);
  }

  getUserById(id: number): Promise<Iuser> {
    return lastValueFrom(this.http.get<Iuser>(`${environment.apiUrl}/users/${id}`));
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
