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

  // --- NUEVO: usuario actual para el avatar ---
  user: Iuser | null = null;

  constructor() {
    // leemos el usuario guardado al arrancar
    this.user = this.auth.getCurrentUser();

    // nos suscribimos a los cambios (login, logout, actualización de perfil)
    this.auth.user$.subscribe((u) => {
      this.user = u;
    });

    window.addEventListener('storage', this.onStorage);
  }

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
  private onStorage = () => {
    // si cambia el storage, volvemos a leer usuario
    this.user = this.auth.getCurrentUser();
  };

  ngOnDestroy() {
    window.removeEventListener('storage', this.onStorage);
  }
}
