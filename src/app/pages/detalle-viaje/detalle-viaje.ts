import { Component, inject, Input, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TripService } from '../../core/services/viajes';
import { Trip } from '../../interfaces/trip';
import { DatePipe, NgClass } from '@angular/common';
import { Iuser } from '../../interfaces/iuser';
import { Router } from '@angular/router';
import { firstValueFrom, switchMap, forkJoin, of, from } from 'rxjs';
import { CardUsuario } from '../../components/card-usuario/card-usuario';
import { AuthService } from '../../core/services/auth';
import { ParticipantService } from '../../core/services/participant.service';
import { ParticipationService } from '../../core/services/participations';
import { toast } from 'ngx-sonner';
import { ForoService } from '../../core/services/foro.service';
import { NotificationsService } from '../../core/services/notifications';
import { map, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-detalle-viaje',
  standalone: true,
  imports: [DatePipe, CardUsuario, RouterLink, NgClass],
  templateUrl: './detalle-viaje.html',
  styleUrl: './detalle-viaje.css',
})
export class DetalleViaje {
  @Input() trip!: any;
  @Input() usuario: Iuser | null = null;

  resumenMensajes: { id: number; author: string; content: string; created_at: string }[] = [];
  ultimosMensajes: { id: number; author: string; content: string; created_at: string }[] = [];
  cargandoResumenForo = false;

  private foroService = inject(ForoService);
  private route = inject(ActivatedRoute);
  private tripService = inject(TripService);
  private participantService = inject(ParticipantService);
  private participationService = inject(ParticipationService);
  private notificationsService = inject(NotificationsService);

  constructor(private authService: AuthService, private router: Router) {}

  viaje: Trip | null = null;
  public itinerarioPorDia: string[] = [];

  solicitudEnviada = signal<boolean>(false);
  solicitudStatus = signal<'pending' | 'accepted' | 'rejected' | null>(null);
  enviandoSolicitud = signal<boolean>(false);

  mostrarToast = signal<boolean>(false);
  tipoToast = signal<'success' | 'error' | 'warning' | 'info'>('info');
  mensajeToast = signal<string>('');
  detalleToast = signal<string>('');
  ocultandoToast = signal<boolean>(false);

  services = [
    { control: 'flights', label: 'Transporte (Vuelos, Tren, Bus...)' },
    { control: 'tickets', label: 'Tickets' },
    { control: 'visits', label: 'Visitas' },
    { control: 'full_board', label: 'Pensión completa' },
    { control: 'travel_insurance', label: 'Seguro de viaje' },
    { control: 'tour_guide', label: 'Guía turístico' },
    { control: 'informative_material', label: 'Material informativo' },
    { control: 'breakfast', label: 'Desayuno' },
    { control: 'visas', label: 'Visados' },
    { control: 'assistance24', label: 'Asistencia 24h' },
  ];

  detalleViaje: any = {};
  usuarioActual: Iuser | null = null;
  participantesConfirmados: any[] = [];
  participants: any[] = [];

  mainImageUrl: string = 'images/mainDefault.jpg';
  mainImageAlt: string = 'Foto principal por defecto';
  portadaImageUrl: string = 'images/coverDefault.jpg';
  portadaImageAlt: string = 'Imagen de portada por defecto';

  cargandoSolicitudStatus = signal<boolean>(false);

  private cargarResumenForo(tripId: number): void {
    this.cargandoResumenForo = true;

    this.foroService
      .getMessages(tripId, 1, 2)
      .pipe(
        switchMap((res) => {
          const mensajes = Array.isArray(res.results?.results) ? res.results.results : [];

          if (!mensajes.length) {
            return of({ mensajes, diccionarioUsuarios: {} as Record<number, string> });
          }

          const idsUnicos = Array.from(
            new Set(mensajes.map((m: any) => m.sender_id).filter((id: any) => !!id))
          );

          const peticionesUsuarios = idsUnicos.map((id) =>
            from(this.authService.getUserById(id)).pipe(catchError(() => of(null)))
          );

          return forkJoin(peticionesUsuarios).pipe(
            map((usuarios) => {
              const diccionarioUsuarios: Record<number, string> = {};
              usuarios.forEach((u: any, index) => {
                const id = idsUnicos[index];
                if (u) {
                  diccionarioUsuarios[id] = u.username || `Usuario ${id}`;
                }
              });
              return { mensajes, diccionarioUsuarios };
            })
          );
        }),
        catchError(() => {
          return of({ mensajes: [], diccionarioUsuarios: {} as Record<number, string> });
        })
      )
      .subscribe(({ mensajes, diccionarioUsuarios }) => {
        this.ultimosMensajes = mensajes.map((m: any) => ({
          id: m.id,
          author: diccionarioUsuarios[m.sender_id] || `Usuario ${m.sender_id}`,
          content: m.message ?? '',
          created_at: m.created_at,
        }));
        this.cargandoResumenForo = false;
      });
  }

  cargarImagenes(tripId: number) {
    this.tripService.getImagesByTripId(tripId).subscribe({
      next: (data: any) => {
        const fotos: any[] = data?.results?.results || [];

        const fotoMain = fotos.find((f) => f.main_img == '1' || f.main_img == 1);
        const fotoPortada = fotos.find((f) => f.main_img == '0' || f.main_img == 0);

        this.mainImageUrl = fotoMain?.url || 'images/mainDefault.jpg';
        this.mainImageAlt = fotoMain?.description || 'Foto principal';

        this.portadaImageUrl = fotoPortada?.url || 'images/coverDefault.jpg';
        this.portadaImageAlt = fotoPortada?.description || 'Imagen de portada';
      },
      error: () => {},
    });
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

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.usuarioActual = this.authService.getCurrentUser();

    if (!id) return;

    try {
      this.viaje = await this.tripService.getTripById(Number(id));
      this.detalleViaje = this.viaje;

      if (this.viaje?.itinerary) {
        this.itinerarioPorDia =
          this.viaje.itinerary.match(/D[ií]a\s*\d+\s*.*?(?=D[ií]a\s*\d+\s*|$)/gis) || [];
      } else {
        this.itinerarioPorDia = [];
      }

      if (this.viaje?.creator_id) {
        try {
          this.usuario = await this.authService.getUserById(this.viaje.creator_id);
        } catch {
          this.usuario = null;
        }
      }

      if (this.usuarioActual && this.viaje?.id && !this.esCreador) {
        this.checkSolicitudEnviada(this.viaje.id, this.usuarioActual.id);
      }

      this.participationService.getParticipantsByTripId(this.viaje.id).subscribe({
        next: () => {
          if (!this.viaje) return;
          this.participationService.getParticipantsByTripIdWithImages(this.viaje.id).subscribe({
            next: (data: any[]) => {
              this.participants = data
                .filter((p: any) => p.status === 'accepted' && p.user_id !== this.viaje?.creator_id)
                .map((p: any) => ({
                  id: p.user_id,
                  username: p.username,
                  email: p.email ?? '',
                  image: p.user_image_url,
                  bio: p.bio || '',
                  phone: p.phone || '',
                })) as Iuser[];

              this.participantesConfirmados = data.filter(
                (p: any) => p.status === 'accepted' && p.user_id !== this.viaje?.creator_id
              );
            },
            error: () => {},
          });
        },
      });

      if (this.viaje?.id) {
        this.cargarResumenForo(this.viaje.id);
      }

      this.cargarImagenes(Number(id));
    } catch {
      this.viaje = null;
      this.usuario = null;
      this.itinerarioPorDia = [];
    }
  }

  get esCreador(): boolean {
    return this.usuarioActual?.id === this.viaje?.creator_id;
  }

  mostrarToastPersonalizado(
    tipo: 'success' | 'error' | 'warning' | 'info',
    mensaje: string,
    detalle: string = '',
    duracion: number = 2000
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

  async handleSolicitud() {
    if (!this.usuarioActual) {
      this.mostrarToastPersonalizado(
        'warning',
        'Sesión requerida',
        'Debes iniciar sesión para solicitar unirte a un viaje'
      );
      setTimeout(() => this.router.navigate(['/login']), 1500);
      return;
    }

    if (!this.viaje?.id) {
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
        this.participantService.requestToJoinTrip(this.viaje.id)
      );

      this.mostrarToastPersonalizado('success', 'Solicitud enviada', response.message, 5000);
      this.solicitudStatus.set('pending');
      this.solicitudEnviada.set(true);

      if (this.usuarioActual && this.viaje?.creator_id) {
        const token = this.authService.gettoken();
        if (token) {
          const notiBody = {
            title: 'Nueva solicitud de viaje',
            message: `${this.usuarioActual.username} ha solicitado unirse a tu viaje "${this.viaje.title}".`,
            type: 'trip',
            is_read: 0,
            sender_id: this.usuarioActual.id,
            receiver_id: this.viaje.creator_id,
          };
          this.notificationsService.create(notiBody, token).subscribe({
            next: () => {},
            error: () => {},
          });
        }
      }
    } catch (error: any) {
      const errorMsg = error?.message || 'Error al enviar la solicitud de participación';
      this.mostrarToastPersonalizado('error', 'Error en la solicitud', errorMsg, 1000);
    } finally {
      this.enviandoSolicitud.set(false);
    }
  }

  async eliminarViaje() {
    if (!this.viaje?.id) {
      toast.warning('El viaje no tiene un ID válido.');
      return;
    }

    const toastId = toast.loading('Eliminando viaje...');

    try {
      await firstValueFrom(this.tripService.deleteTripById(this.viaje.id));
      toast.success('Viaje eliminado correctamente', {
        id: toastId,
        duration: 1000,
      });
      this.router.navigate(['/home']);
    } catch {
      toast.error('No se pudo eliminar el viaje.', {
        id: toastId,
        duration: 1000,
      });
    }
  }

  showDeleteModal = false;

  openDeleteModal() {
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.showDeleteModal = false;
  }

  async confirmDelete() {
    this.showDeleteModal = false;
    await this.eliminarViaje();
  }

  irADetalleUsuario(usuario: Iuser | null) {
    if (usuario && usuario.id) {
      this.router.navigate([`perfil/${usuario.id}`]);
    }
  }

  irAValoraciones() {
    if (this.usuario && this.usuario.id) {
      this.router.navigate([`valoraciones/${this.usuario.id}`]);
    }
  }

  goToValorarPage() {
    if (this.usuario && this.usuario.id) {
      this.router.navigate([`mis-valoraciones/${this.usuario.id}`]);
    }
  }

  goToMyTrip() {
    this.router.navigate(['/gestion-viajes']);
  }

  getGoogleMapsUrl(lat: number, lng: number, zoom: number): string {
    return `https://www.google.com/maps/@${lat},${lng},${zoom}z`;
  }

  get puedeVerForo(): boolean {
    return this.esCreador || this.solicitudStatus() === 'accepted';
  }
}
