import {
  Component,
  inject,
  Input,
  Pipe,
  PipeTransform,
  signal,
  computed,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';

import { CardUsuario } from '../card-usuario/card-usuario';
import { Minilogin } from '../minilogin/minilogin';

import { AuthService } from '../../core/services/auth';
import { TripService } from '../../core/services/viajes';
import { NotificationsService } from '../../core/services/notifications';
import { ParticipantService } from '../../core/services/participant.service';
import { ParticipationService } from '../../core/services/participations';
import { FavoritesService } from '../../core/services/favorites';

import { Iuser } from '../../interfaces/iuser';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';

@Pipe({ name: 'capitalizeFirst', standalone: true })
export class CapitalizeFirstPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}

@Component({
  selector: 'app-card-viaje',
  imports: [CardUsuario, DatePipe, DecimalPipe, CapitalizeFirstPipe, Minilogin, NgClass],
  templateUrl: './card-viaje.html',
  styleUrl: './card-viaje.css',
})
export class CardViaje implements OnInit, OnDestroy {
  @Input() trip!: any;

  private tripService = inject(TripService);
  private notificationsService = inject(NotificationsService);
  private participantService = inject(ParticipantService);
  private participationService = inject(ParticipationService);
  private favoritesService = inject(FavoritesService);

  private destroy$ = new Subject<void>();

  usuario: Iuser | null = null;
  currentUser: Iuser | null = null;

  enviandoSolicitud = signal<boolean>(false);
  solicitudEnviada = signal<boolean>(false);
  solicitudStatus = signal<'pending' | 'accepted' | 'rejected' | null>(null);
  cargandoSolicitudStatus = signal<boolean>(false);

  tipoToast = signal<'success' | 'error' | 'warning' | 'info'>('info');
  mensajeToast = signal<string>('');
  detalleToast = signal<string>('');
  mostrarToast = signal<boolean>(false);
  ocultandoToast = signal<boolean>(false);

  portadaImageUrl: string = 'images/coverDefault.jpg';
  portadaImageAlt: string = 'Imagen de portada por defecto';

  constructor(private authService: AuthService, private router: Router) {}

  get esCreador(): boolean {
    return this.currentUser?.id === this.trip?.creator_id;
  }

  ngOnInit() {
    this.trip.isFavorite = !!this.trip.isFavorite;
    this.trip.favoriteId = this.trip.favoriteId ?? null;

    this.cargarImagenes(Number(this.trip?.id));

    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe((globalUser) => {
      this.currentUser = globalUser;

      if (globalUser && this.trip?.creator_id === globalUser.id) {
        this.usuario = globalUser;
      } else if (this.trip?.creator_id) {
        this.authService.getUserById(this.trip.creator_id).then((user) => {
          this.usuario = user;
        });
      }

      if (globalUser && this.trip?.id) {
        const token = this.authService.gettoken();
        if (token) {
          this.favoritesService
            .getFavoritesByUser(globalUser.id, token)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (favorites) => {
                const fav = favorites.find((f: any) => f.trip.id === this.trip.id);
                if (fav) {
                  this.trip.isFavorite = true;
                  this.trip.favoriteId = fav.id;
                } else {
                  this.trip.isFavorite = false;
                  this.trip.favoriteId = null;
                }
              },
              error: () => {
                this.trip.isFavorite = false;
                this.trip.favoriteId = null;
              },
            });

          this.checkSolicitudEnviada(this.trip.id, globalUser.id);
        }
      } else {
        this.trip.isFavorite = false;
        this.trip.favoriteId = null;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkSolicitudEnviada(tripId: number, userId: number): void {
    this.cargandoSolicitudStatus.set(true);

    this.participationService.getParticipantsByTripId(tripId).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res.data) ? res.data : [];
        const myParticipation = data.find((p: any) => p.user_id === userId);

        if (!myParticipation) {
          this.solicitudStatus.set(null);
        } else {
          const status = myParticipation.status as 'pending' | 'accepted' | 'rejected';
          this.solicitudStatus.set(status);
        }
      },
      error: () => {
        this.solicitudStatus.set(null);
      },
      complete: () => {
        this.cargandoSolicitudStatus.set(false);
      },
    });
  }

  irADetalleViaje() {
    if (this.trip && this.trip.id) {
      this.router.navigate([`viaje/${this.trip.id}`]);
    }
  }

  cargarImagenes(tripId: number) {
    this.tripService.getImagesByTripId(tripId).subscribe({
      next: (data: any) => {
        const fotos: any[] = data?.results?.results || [];
        const fotoPortada = fotos.find((f) => f.main_img == '0' || f.main_img == 0);

        this.portadaImageUrl = fotoPortada?.url || 'images/coverDefault.jpg';
        this.portadaImageAlt = fotoPortada?.description || 'Imagen de portada';
      },
      error: () => {},
    });
  }

  isTripClosedByDate(): boolean {
    if (!this.trip?.end_date) return false;
    const today = new Date();
    const end = new Date(this.trip.end_date);
    return end.getTime() < today.setHours(0, 0, 0, 0);
  }

  isLastDays(): boolean {
    if (!this.trip?.start_date) return false;
    const today = new Date();
    const start = new Date(this.trip.start_date);
    const diffDays = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 15;
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
    if (this.isTripClosedByDate()) {
      return 'bg-secondary';
    }

    if (this.isLastDays()) {
      return 'bg-danger';
    }

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
    if (this.isTripClosedByDate()) {
      return 'Cerrado';
    }

    if (this.isLastDays()) {
      return 'Últimos días';
    }

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
    if (!this.isLoggedIn()) return;

    if (this.currentUser && trip.creator_id === this.currentUser.id) {
      return;
    }

    const token = this.authService.gettoken();
    if (!token) return;

    if (!trip.isFavorite) {
      this.favoritesService.addFavorite(trip.id, token).subscribe({
        next: (favorite: any) => {
          const fav = (favorite as any).data ? (favorite as any).data[0] : favorite;
          trip.isFavorite = true;
          trip.favoriteId = fav.id;
        },
        error: () => {
          trip.isFavorite = false;
        },
      });
    } else {
      if (!trip.favoriteId) return;
      this.favoritesService.removeFavoriteById(trip.favoriteId, token).subscribe({
        next: () => {
          trip.isFavorite = false;
          trip.favoriteId = null;
        },
        error: () => {
          trip.isFavorite = true;
        },
      });
    }
  }

  async handleSolicitud() {
    if (!this.currentUser) {
      this.mostrarToastPersonalizado(
        'warning',
        'Sesión requerida',
        'Debes iniciar sesión para solicitar unirte a un viaje'
      );
      setTimeout(() => this.router.navigate(['/login']), 1500);
      return;
    }

    if (!this.trip?.id) {
      this.mostrarToastPersonalizado(
        'error',
        'Viaje no disponible',
        'El viaje no existe o no se cargó correctamente'
      );
      return;
    }

    if (this.esCreador) {
      this.mostrarToastPersonalizado(
        'warning',
        'No permitido',
        'No puedes solicitar unirte a tu propio viaje'
      );
      return;
    }

    if (this.enviandoSolicitud() || this.solicitudStatus() === 'pending') {
      this.mostrarToastPersonalizado(
        'info',
        'Solicitud pendiente',
        'Ya has enviado una solicitud para este viaje'
      );
      return;
    }

    try {
      this.enviandoSolicitud.set(true);

      const response = await firstValueFrom(
        this.participantService.requestToJoinTrip(this.trip.id)
      );

      this.mostrarToastPersonalizado('success', 'Solicitud enviada', response.message, 5000);
      this.solicitudStatus.set('pending');
      this.solicitudEnviada.set(true);
      this.trip.solicitado = true;

      if (this.currentUser && this.trip?.creator_id) {
        const token = this.authService.gettoken();
        if (token) {
          const notiBody = {
            title: 'Nueva solicitud de viaje',
            message: `${this.currentUser.username} ha solicitado unirse a tu viaje "${this.trip.title}".`,
            type: 'trip',
            is_read: 0,
            sender_id: this.currentUser.id,
            receiver_id: this.trip.creator_id,
          };
          this.notificationsService.create(notiBody, token).subscribe({
            next: () => {},
            error: () => {},
          });
        }
      }
    } catch (error: any) {
      const errorMsg = error?.message || 'Error al enviar la solicitud de participación';
      this.mostrarToastPersonalizado('error', 'Error en la solicitud', errorMsg, 5000);
    } finally {
      this.enviandoSolicitud.set(false);
    }
  }

  mostrarToastPersonalizado(
    tipo: 'success' | 'error' | 'warning' | 'info',
    mensaje: string,
    detalle: string = '',
    duracion: number = 4000
  ): void {
    this.tipoToast.set(tipo);
    this.mensajeToast.set(mensaje);
    this.detalleToast.set(detalle);
    this.ocultandoToast.set(false);
    this.mostrarToast.set(true);

    setTimeout(() => {
      this.ocultarToast();
    }, duracion);
  }

  ocultarToast(): void {
    this.ocultandoToast.set(true);

    setTimeout(() => {
      this.mostrarToast.set(false);
      this.ocultandoToast.set(false);
    }, 300);
  }

  toastClass = computed(() => {
    const tipo = this.tipoToast();
    const baseClass = 'alert';

    switch (tipo) {
      case 'success':
        return `${baseClass} alert-success`;
      case 'error':
        return `${baseClass} alert-danger`;
      case 'warning':
        return `${baseClass} alert-warning`;
      case 'info':
      default:
        return `${baseClass} alert-info`;
    }
  });

  toastIcon = computed(() => {
    const tipo = this.tipoToast();

    switch (tipo) {
      case 'success':
        return 'bi-check-circle-fill';
      case 'error':
        return 'bi-exclamation-circle-fill';
      case 'warning':
        return 'bi-exclamation-triangle-fill';
      case 'info':
      default:
        return 'bi-info-circle-fill';
    }
  });

  getGoogleMapsUrl(lat: number, lng: number, zoom: number): string {
    return `https://www.google.com/maps/@${lat},${lng},${zoom}z`;
  }
}
