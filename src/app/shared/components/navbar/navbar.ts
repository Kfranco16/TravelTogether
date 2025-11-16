import { Component, OnDestroy, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { Iuser } from '../../../interfaces/iuser';

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

  // 👤 Usuario actual (para la foto de perfil en "Mi espacio")
  currentUser: Iuser | null = null;

  // Estado de autenticación: leemos directamente del servicio (token en localStorage)
  get isAuthenticated(): boolean {
    return this.auth.isAuth();
  }

  // Mantener la UI sincronizada si el token cambia desde otra pestaña
  private onStorage = () => {
    this.currentUser = this.auth.getCurrentUser();
  };

  constructor() {
    // Escuchamos cambios del usuario en AuthService
    this.auth.user$.subscribe((u) => {
      this.currentUser = u;
    });

    // Cargar usuario inicial (si ya estaba logueado)
    this.currentUser = this.auth.getCurrentUser();

    window.addEventListener('storage', this.onStorage);
  }

  // UX móvil (hamburguesa)
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

  ngOnDestroy() {
    window.removeEventListener('storage', this.onStorage);
  }
}
