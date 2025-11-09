import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AsyncPipe],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class Navbar {
  private auth = inject(AuthService);

  isAuth$ = this.auth.isAuth$;

  //por si usamos asincrono
  get isAuthenticated() {
    return this.auth.isAuth();
  }

  open = false;

  onToggleOpen() {
    this.open = !this.open;
  }
  onOpen() {
    this.open = true;
  }
  onClose() {
    this.open = false;
  }
  onLogout() {
    this.auth.logout();
  }
}
