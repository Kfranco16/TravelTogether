import { Component, inject, Input, Pipe, PipeTransform, signal, computed } from '@angular/core';
import { CardUsuario } from '../card-usuario/card-usuario';
import { Minilogin } from '../minilogin/minilogin';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { Iuser } from '../../interfaces/iuser';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { TripService } from '../../core/services/viajes';
import { NotificationsService } from '../../core/services/notifications';
import { ParticipantService } from '../../core/services/participant.service';
import { toast, NgxSonnerToaster } from 'ngx-sonner';
import { firstValueFrom, timeInterval } from 'rxjs';

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
export class CardViaje {
  @Input() trip!: any;
  private tripService = inject(TripService);
  private notificationsService = inject(NotificationsService);
  private participantService = inject(ParticipantService);

  usuario: Iuser | null = null; // dueño del viaje (creator)
  currentUser: Iuser | null = null; // usuario logueado

  // ========================================================================
  // SIGNALS PARA MANEJO DE SOLICITUD DE PARTICIPACIÓN
  // ========================================================================

  /**
   * Signal que almacena el estado de envío de solicitud
   * true = solicitando, false = inactivo
   */
  enviandoSolicitud = signal<boolean>(false);

  /**
   * Signal que controla si ya se envió la solicitud (evita duplicados)
   * true = solicitud enviada, false = no enviada
   */
  solicitudEnviada = signal<boolean>(false);

  /**
   * Signal que almacena el tipo de toast a mostrar
   * success | error | warning | info
   */
  tipoToast = signal<'success' | 'error' | 'warning' | 'info'>('info');

  /**
   * Signal que almacena el mensaje principal del toast
   */
  mensajeToast = signal<string>('');

  /**
   * Signal que almacena la descripción del toast
   */
  detalleToast = signal<string>('');

  /**
   * Signal que controla la visibilidad del toast
   */
  mostrarToast = signal<boolean>(false);

  /**
   * Signal que controla la animación de salida del toast
   */
  ocultandoToast = signal<boolean>(false);

  constructor(private authService: AuthService, private router: Router) {}

  irADetalleViaje() {
    if (this.trip && this.trip.id) {
      this.router.navigate([`viaje/${this.trip.id}`]);
    }
  }

  portadaImageUrl: string = 'images/coverDefault.jpg';
  portadaImageAlt: string = 'Imagen de portada por defecto';

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

  ngOnInit() {
    this.cargarImagenes(Number(this.trip?.id));

    this.authService.user$.subscribe((globalUser) => {
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
        this.tripService.isFavoriteByTrip(this.trip.id, token!).subscribe({
          next: (favorites) => {
            if (favorites && favorites.length > 0) {
              this.trip.isFavorite = true;
              this.trip.favoriteId = favorites[0].id;
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

    // Bloquear favoritos en viajes propios
    if (this.currentUser && trip.creator_id === this.currentUser.id) {
      return;
    }

    const token = this.authService.gettoken();

    if (!trip.isFavorite) {
      this.tripService.addFavorite(trip.id, token!).subscribe({
        next: (favorite) => {
          trip.isFavorite = true;
          trip.favoriteId = favorite.data[0].id;
        },
        error: () => {
          trip.isFavorite = false;
        },
      });
    } else {
      if (!trip.favoriteId) return;
      this.tripService.removeFavoriteById(trip.favoriteId, token!).subscribe({
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

  toggleSolicitud(trip: any) {
    if (!this.currentUser?.id) return;

    // ✅ Validación 1: Verificar que el usuario esté autenticado
    if (!this.currentUser) {
      this.mostrarToastPersonalizado(
        'warning',
        'Sesión requerida',
        'Debes iniciar sesión para solicitar unirte a un viaje'
      );
      setTimeout(() => this.router.navigate(['/login']), 1500);
      return;
    }

    // ✅ Validación 2: Verificar que el viaje exista
    if (!trip?.id) {
      this.mostrarToastPersonalizado(
        'error',
        'Viaje no disponible',
        'El viaje no existe o no se cargó correctamente'
      );
      return;
    }

    // ✅ Validación 3: Verificar que no sea el creador
    if (this.currentUser.id === trip.creator_id) {
      this.mostrarToastPersonalizado(
        'warning',
        'No permitido',
        'No puedes solicitar unirte a tu propio viaje'
      );
      return;
    }

    // ✅ Validación 4: Prevenir solicitudes duplicadas
    if (this.solicitudEnviada() || this.enviandoSolicitud()) {
      this.mostrarToastPersonalizado(
        'info',
        'Solicitud pendiente',
        'Ya has enviado una solicitud para este viaje'
      );
      return;
    }

    this.handleSolicitud(trip);

    if (!this.currentUser?.id) return;

    trip.solicitado = !trip.solicitado;
    const token = this.authService.gettoken();
    const notiBody = {
      title: 'Nueva solicitud de viaje',
      message: `${this.currentUser.username} ha solicitado unirse a tu viaje "${this.trip.title}".`,
      type: 'trip',
      is_read: 0, // <- obligatorio para que no sea null
      sender_id: this.currentUser.id,
      receiver_id: this.trip.creator_id,
    };
  }

  /**
   * Método para solicitar unirse a un viaje
   *
   * Flujo:
   * 1. Activar estado de carga
   * 2. Llamar al servicio ParticipantService.requestToJoinTrip()
   * 3. Si es exitoso: mostrar toast con el mensaje del API
   * 4. Si falla: mostrar toast de error
   * 5. Actualizar estado del botón
   *
   * @async
   */
  async handleSolicitud(trip: any) {
    try {
      // 🔄 Activar estado de carga (mostrar spinner)
      this.enviandoSolicitud.set(true);

      // 📡 Realizar la petición al servidor
      const response = await firstValueFrom(this.participantService.requestToJoinTrip(trip.id));

      // ✅ Si la respuesta es exitosa
      // Mostrar el mensaje del API en un toast personalizado
      this.mostrarToastPersonalizado('success', 'Solicitud enviada', response.message, 5000);

      // 🎯 Marcar que la solicitud fue enviada
      this.solicitudEnviada.set(true);
      trip.solicitado = true;

      // 💬 Log para debugging
      console.log('✅ Solicitud de participación exitosa:', response.data);
    } catch (error: any) {
      // ❌ Manejar error
      const errorMsg = error?.message || 'Error al enviar la solicitud de participación';

      console.error('❌ Error en handleSolicitud:', error);

      this.mostrarToastPersonalizado('error', 'Error en la solicitud', errorMsg, 5000);
    } finally {
      // 🔄 Desactivar estado de carga
      this.enviandoSolicitud.set(false);
    }
  }

  /**
   * Mostrar un toast con animación
   *
   * @param tipo - Tipo de toast: 'success', 'error', 'warning', 'info'
   * @param mensaje - Título/mensaje principal
   * @param detalle - Descripción adicional (opcional)
   * @param duracion - Duración en ms antes de ocultarse (default: 4000ms)
   */
  mostrarToastPersonalizado(
    tipo: 'success' | 'error' | 'warning' | 'info',
    mensaje: string,
    detalle: string = '',
    duracion: number = 4000
  ): void {
    // Actualizar propiedades del toast
    this.tipoToast.set(tipo);
    this.mensajeToast.set(mensaje);
    this.detalleToast.set(detalle);
    this.ocultandoToast.set(false);
    this.mostrarToast.set(true);

    // Auto-ocultar después de la duración especificada
    setTimeout(() => {
      this.ocultarToast();
    }, duracion);
  }

  /**
   * Ocultar el toast con animación de salida
   */
  ocultarToast(): void {
    this.ocultandoToast.set(true);

    // Esperar a que termine la animación antes de ocultarlo
    setTimeout(() => {
      this.mostrarToast.set(false);
      this.ocultandoToast.set(false);
    }, 300);
  }

  /**
   * Signal computed que genera la clase CSS para el toast según su tipo
   * Reemplaza el método getToastClass() por una solución reactiva
   */
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
        return `${baseClass} alert-info`;
      default:
        return `${baseClass} alert-info`;
    }
  });

  /**
   * Signal computed que genera el icono según el tipo de toast
   * Reemplaza el método getToastIcon() por una solución reactiva
   */
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
        return 'bi-info-circle-fill';
      default:
        return 'bi-info-circle-fill';
    }
  });

  // ========================================================================
  // MÉTODOS EXISTENTES
  // ========================================================================

  getGoogleMapsUrl(lat: number, lng: number, zoom: number): string {
    return `https://www.google.com/maps/@${lat},${lng},${zoom}z`;
  }
}
