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

  // Datos del usuario
  get currentUser(): Iuser | null {
    return this.auth.getCurrentUser();
  }

  get isAuthenticated(): boolean {
    return this.auth.isAuth();
  }

  // 🔔 Simulación de notificaciones (reemplazar por backend más adelante)
  hasNotifications = true;

  notif = {
    perfil: false,
    datos: false,
    reservas: true,
    misViajes: true,
    favoritos: false,
    notificaciones: false,
    foros: true,
  };

  // ---- MÉTODOS ----
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

  // Marcar una sección como "vista"
  onSectionOpen(section: keyof typeof this.notif) {
    this.notif[section] = false;
    this.hasNotifications = Object.values(this.notif).some((v) => v === true);
  }

  // Mantener UI sincronizada entre pestañas
  private onStorage = () => {};

  constructor() {
    window.addEventListener('storage', this.onStorage);
  }

  ngOnDestroy() {
    window.removeEventListener('storage', this.onStorage);
  }
}
