import { Component, Input, Pipe, PipeTransform } from '@angular/core';
import { CardUsuario } from '../card-usuario/card-usuario';
import { Login } from '../../pages/login/login';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { Iuser } from '../../interfaces/iuser';
import { DatePipe, DecimalPipe } from '@angular/common';

@Pipe({ name: 'capitalizeFirst', standalone: true })
export class CapitalizeFirstPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}

@Component({
  selector: 'app-card-viaje',
  imports: [CardUsuario, Login, DatePipe, DecimalPipe, CapitalizeFirstPipe],
  templateUrl: './card-viaje.html',
  styleUrl: './card-viaje.css',
})
export class CardViaje {
  @Input() trip!: any;

  usuario: Iuser | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  irADetalleViaje() {
    if (this.trip && this.trip.id) {
      this.router.navigate([`viaje/${this.trip.id}`]);
    }
  }

  ngOnInit() {
    // mostrar cambios sin recargar pagina
    this.authService.user$.subscribe((globalUser) => {
      if (globalUser && this.trip?.creator_id === globalUser.id) {
        this.usuario = globalUser;
      } else if (this.trip?.creator_id) {
        this.authService.getUserById(this.trip.creator_id).then((user) => {
          this.usuario = user;
        });
      }
    });
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

  getGoogleMapsUrl(lat: number, lng: number, zoom: number): string {
    return `https://www.google.com/maps/@${lat},${lng},${zoom}z`;
  }

  imagenes = [
    'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
  ];
}
