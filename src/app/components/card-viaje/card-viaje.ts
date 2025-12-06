import { Component, inject, Input, Pipe, PipeTransform } from '@angular/core';
import { CardUsuario } from '../card-usuario/card-usuario';
import { Login } from '../../pages/login/login';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { Iuser } from '../../interfaces/iuser';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TripService } from '../../core/services/viajes';
import { FavoritesService } from '../../core/services/favorites';

@Pipe({ name: 'capitalizeFirst', standalone: true })
export class CapitalizeFirstPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}

@Component({
  selector: 'app-card-viaje',
  imports: [CardUsuario, Login, DatePipe, DecimalPipe, CapitalizeFirstPipe, RouterLink],
  templateUrl: './card-viaje.html',
  styleUrl: './card-viaje.css',
})
export class CardViaje {
  @Input() trip!: any;

  private tripService = inject(TripService);
  private authService = inject(AuthService);
  private favoritesService = inject(FavoritesService);
  private router = inject(Router);

  usuario: Iuser | null = null;

  // Imagen de portada
  portadaImageUrl: string = 'images/coverDefault.jpg';
  portadaImageAlt: string = 'Imagen de portada por defecto';

  // ID del registro de favorito en BD (para poder borrarlo luego)
  favoriteId: number | null = null;

  ngOnInit() {
    this.cargarImagenes(Number(this.trip?.id));

    // Cargamos el usuario creador del viaje
    this.authService.user$.subscribe((globalUser) => {
      if (globalUser && this.trip?.creator_id === globalUser.id) {
        this.usuario = globalUser;
      } else if (this.trip?.creator_id) {
        this.authService.getUserById(this.trip.creator_id).then((user) => {
          this.usuario = user;
        });
      }
    });

    // Si hay usuario logado, comprobamos si ESTE viaje ya es favorito suyo
    const token = this.authService.gettoken();
    const currentUser = this.authService.getCurrentUser();

    if (token && currentUser && this.trip?.id) {
      this.favoritesService.isFavoriteByTrip(this.trip.id, token).subscribe({
        next: (data: any) => {
          // Dependiendo de cómo responda el backend:
          // - si devuelve un array directamente -> lo usamos
          // - si devuelve {results: [...]} -> usamos results
          const list = Array.isArray(data)
            ? data
            : Array.isArray(data?.results)
            ? data.results
            : [];

          const favDelUsuario = list.find((f: any) => f.user_id === currentUser.id);

          if (favDelUsuario) {
            this.trip.isFavorite = true;
            this.favoriteId = favDelUsuario.id;
          } else {
            this.trip.isFavorite = false;
            this.favoriteId = null;
          }
        },
        error: () => {
          this.trip.isFavorite = false;
          this.favoriteId = null;
        },
      });
    }
  }

  cargarImagenes(tripId: number) {
    this.tripService.getImagesByTripId(tripId).subscribe({
      next: (data: any) => {
        const fotos: any[] = data?.results?.results || [];

        const fotoMain = fotos.find((f) => f.main_img == '1' || f.main_img == 1);
        const fotoPortada = fotos.find((f) => f.main_img == '0' || f.main_img == 0);

        this.portadaImageUrl = fotoPortada?.url || 'images/coverDefault.jpg';
        this.portadaImageAlt = fotoPortada?.description || 'Imagen de portada';
      },
      error: () => {},
    });
  }

  irADetalleViaje() {
    if (this.trip && this.trip.id) {
      this.router.navigate([`viaje/${this.trip.id}`]);
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

  isLoggedIn(): boolean {
    return this.authService.isAuth();
  }

  getFavoriteIconClass(isFavorite: any): string {
    if (!this.isLoggedIn()) {
      return 'bi-heart text-white disabled';
    }
    return isFavorite ? 'bi-heart-fill text-danger' : 'bi-heart text-white';
  }

  toggleFavorito(trip: any) {
    if (!this.isLoggedIn()) {
      // Si quieres, aquí puedes redirigir a login:
      // this.router.navigate(['/login']);
      return;
    }

    const token = this.authService.gettoken();
    const user = this.authService.getCurrentUser();

    if (!token || !user) return;

    // Si NO es favorito todavía -> creamos el favorito
    if (!trip.isFavorite) {
      this.favoritesService.addFavorite(trip.id, token).subscribe({
        next: (fav: any) => {
          trip.isFavorite = true;

          // Intentamos capturar el id que devuelve el backend
          this.favoriteId =
            fav?.id ??
            fav?.favorite?.id ??
            (Array.isArray(fav?.results) ? fav.results[0]?.id : null);

          // Por si queremos guardarlo también en el propio trip
          trip.favoriteId = this.favoriteId;
        },
        error: (err) => {
          console.error('Error creando favorito', err);
        },
      });
    } else {
      // Ya es favorito -> lo eliminamos si tenemos su id
      const idToDelete = this.favoriteId ?? trip.favoriteId;
      if (!idToDelete) {
        console.warn('No tenemos id de favorito para borrar');
        return;
      }

      this.favoritesService.removeFavoriteById(idToDelete, token).subscribe({
        next: () => {
          trip.isFavorite = false;
          this.favoriteId = null;
          trip.favoriteId = null;
        },
        error: (err) => {
          console.error('Error eliminando favorito', err);
        },
      });
    }
  }

  toggleSolicitud(trip: any) {
    trip.solicitado = !trip.solicitado;
    // Futura llamada a la API para la solicitud de unirse al viaje.
  }

  getGoogleMapsUrl(lat: number, lng: number, zoom: number): string {
    return `https://www.google.com/maps/@${lat},${lng},${zoom}z`;
  }
}
