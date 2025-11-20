import { Component, OnDestroy, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';

import { AuthService } from '../../../core/services/auth';
import { Iuser } from '../../../interfaces/iuser';

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

  //Simulación de notificaciones (luego se reemplazará por backend)
  notif = {
    perfil: false,
    datos: true,
    reservas: false,
    misViajes: false,
    favoritos: true,
    foros: true,
  };

  // Bandera global para el avatar (aro + campanita)
  get hasNotifications(): boolean {
    return Object.values(this.notif).some((v) => v === true);
  }

  // AUTENTICACIÓN / USUARIO

  get isAuthenticated(): boolean {
    return this.auth.isAuth();
  }

  get currentUser(): Iuser | null {
    return this.auth.getCurrentUser();
  }

  //NAVBAR MOBILE

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

  // Mantener la UI sincronizada si cambia el token en otra pestaña
  private onStorage = () => {
    // Al acceder a isAuthenticated / currentUser el template se reevaluará
  };

  constructor() {
    window.addEventListener('storage', this.onStorage);
  }

  ngOnDestroy() {
    window.removeEventListener('storage', this.onStorage);
  }
}
