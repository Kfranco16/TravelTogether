import { Component, Input } from '@angular/core';
import { CardUsuario } from '../card-usuario/card-usuario';
import { Login } from '../../pages/login/login';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { Iuser } from '../../interfaces/iuser';
import { DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-card-viaje',
  imports: [CardUsuario, Login, RouterLink, DatePipe, DecimalPipe],
  templateUrl: './card-viaje.html',
  styleUrl: './card-viaje.css',
})
export class CardViaje {
  @Input() trip!: any;

  usuario: Iuser | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  async ngOnInit() {
    if (this.trip?.creator_id) {
      try {
        this.usuario = await this.authService.getUserById(this.trip.creator_id);
        console.log('Usuario obtenido:', this.usuario);
      } catch (err) {
        console.error('Error obteniendo usuario:', err);
        this.usuario = null;
      }
    }
  }

  irADetalleUsuario() {
    if (this.usuario && this.usuario.id) {
      this.router.navigate([`perfil/${this.usuario.id}`]);
    }
  }

  getShowDaysBadge(startDate: string): boolean {
    const today = new Date();
    const start = new Date(startDate);
    const diff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff < 15 && diff > 0;
  }

  getDaysLeft(startDate: string): number {
    const today = new Date();
    const start = new Date(startDate);
    return Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  getBadgeClass(status: string): string {
    switch (status) {
      case 'open':
        return 'bg-success';
      case 'draft':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  getBadgeText(status: string): string {
    switch (status) {
      case 'open':
        return 'Abierto';
      case 'draft':
        return 'Últimos días';
      default:
        return status;
    }
  }

  toggleFavorito(trip: any) {
    trip.isFavorite = !trip.isFavorite;
  }

  isLoggedIn(): boolean {
    return this.authService.isAuth();
  }

  getFavoriteIconClass(isFavorite: any): string {
    if (this.isLoggedIn() === false) {
      return 'bi-heart text-white disabled';
    }
    return isFavorite ? 'bi-heart-fill text-danger' : 'bi-heart text-white';
  }
  toggleSolicitud(trip: any) {
    trip.solicitado = !trip.solicitado;
    // Futura llamada a la API para la solicitud de unirse al viaje.
  }
}
