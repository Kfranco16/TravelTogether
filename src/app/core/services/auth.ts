import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isAuth = signal<boolean>(this.hasToken());
  private readonly TOKEN_KEY = 'tt_token';

  login(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.isAuth.set(true);
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    this.isAuth.set(false);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }
}
