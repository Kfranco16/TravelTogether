import { Component, OnDestroy, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';

import { AuthService } from '../../../core/services/auth';
import { Iuser } from '../../../interfaces/iuser';

// Tipo de secciones que pueden tener notificaciones
type NotifSection = 'perfil' | 'reservas' | 'misViajes' | 'favoritos' | 'foros';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class Navbar implements OnDestroy {
  private auth = inject(AuthService);

  open = false;

  // Estado de notificaciones por sección
  notif: Record<NotifSection, boolean> = {
    perfil: true,
    reservas: true,
    misViajes: false,
    favoritos: true,
    foros: false,
  };

  // ¿Hay alguna notificación activa? (controla aro + campana)
  get hasNotifications(): boolean {
    return Object.values(this.notif).some((v) => v);
  }

  // Estado de autenticación
  get isAuthenticated(): boolean {
    return this.auth.isAuth();
  }

  // Usuario actual
  get currentUser(): Iuser | null {
    return this.auth.getCurrentUser();
  }

  // Abrir/cerrar menú móvil
  onToggleOpen() {
    this.open = !this.open;
  }
  onOpen() {
    this.open = true;
  }
  onClose() {
    this.open = false;
  }

  // Cerrar sesión
  onLogout() {
    this.auth.logout();
    this.onClose();
  }

  // Cuando el usuario entra en una sección con notificación,
  // apagamos ese punto. Si no quedan notis, el aro volverá a gris y la campana desaparecerá.
  onSectionOpen(section: NotifSection) {
    this.notif[section] = false;
  }

  // Mantener la UI sincronizada si cambia el storage en otra pestaña
  private onStorage = () => {
    // con solo leer isAuthenticated/currentUser Angular reevaluará el template
  };

  constructor() {
    window.addEventListener('storage', this.onStorage);
  }

  ngOnDestroy() {
    window.removeEventListener('storage', this.onStorage);
  }
}
