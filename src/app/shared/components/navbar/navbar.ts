import { Component, inject, Input, OnDestroy } from '@angular/core';
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
  @Input() usuario: Iuser | null = null;

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
  private onStorage = () => {
    /* al acceder a isAuthenticated, Angular reevaluará */
  };
  constructor() {
    window.addEventListener('storage', this.onStorage);
  }
  ngOnDestroy() {
    window.removeEventListener('storage', this.onStorage);
  }

  ngOnInit() {
    this.auth.user$.subscribe((user) => {
      this.usuario = user;
    });
  }

  getUsuarioById(id: number): Iuser | undefined {
    return this.usuario?.id === id ? this.usuario : undefined;
  }
}
