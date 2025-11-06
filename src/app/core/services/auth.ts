import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  login(token: string): void {
    localStorage.setItem('authToken', token);
  }
}
