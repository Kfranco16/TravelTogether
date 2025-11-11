import { Component, inject, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class Navbar implements OnDestroy {
  private auth = inject(AuthService);

  open = false;

  // Estado de autenticación: leemos directamente del servicio (token en localStorage)
  get isAuthenticated(): boolean {
    return this.auth.isAuth();
  }

  // Mantener UX móvil
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
    this.onClose();
  }

  // Mantener la UI sincronizada si el token cambia desde otra pestaña
  private onStorage = () => { /* al acceder a isAuthenticated, Angular reevaluará */ };
  constructor() {
    window.addEventListener('storage', this.onStorage);
  }
  ngOnDestroy() {
    window.removeEventListener('storage', this.onStorage);
  }
}
