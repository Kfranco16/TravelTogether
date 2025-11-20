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

  // Estado de autenticación: leemos directamente del servicio (token en localStorage)
  get isAuthenticated(): boolean {
    return this.auth.isAuth();
  }

  // 👤 Usuario actual (para la foto de perfil en "Mi espacio")
  get currentUser(): Iuser | null {
    return this.auth.getCurrentUser();
  }

  // Nueva parte notificaciones: estado mock de ejemplo
  // (más adelante se podrá conectar a un NotificationService)
  hasNotifications = false; // cambia a true para ver el aro morado y la campanita

  notif = {
    perfil: false,
    datos: false,
    reservas: false,
    misViajes: false,
    favoritos: false,
    foros: false,
  };

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
    // al acceder a isAuthenticated / currentUser, Angular reevaluará el template
  };

  constructor() {
    window.addEventListener('storage', this.onStorage);
  }

  ngOnDestroy() {
    window.removeEventListener('storage', this.onStorage);
  }
}
