import { Component, inject, Input, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TripService, ImageResponse } from '../../core/services/viajes';
import { Trip } from '../../interfaces/trip';
import { DatePipe } from '@angular/common';
import { Iuser } from '../../interfaces/iuser';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { toast } from 'ngx-sonner';

import { CardUsuario } from '../../components/card-usuario/card-usuario';
import { AuthService } from '../../core/services/auth';
import { ParticipantService } from '../../core/services/participant.service';
import { ParticipationService } from '../../core/services/participations';

@Component({
  selector: 'app-detalle-viaje',
  standalone: true,
  imports: [DatePipe, CardUsuario],
  templateUrl: './detalle-viaje.html',
  styleUrl: './detalle-viaje.css',
})
export class DetalleViaje {
  @Input() trip!: any;
  @Input() usuario: Iuser | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  private route = inject(ActivatedRoute);
  private tripService = inject(TripService);
  // 🎯 Nuevo: Inyectar el servicio de participantes para manejar solicitudes
  private participantService = inject(ParticipantService);

  // ========================================================================
  // PROPIEDADES DEL COMPONENTE
  // ========================================================================

  viaje: Trip | null = null;
  public itinerarioPorDia: string[] = [];

  // 🎯 Nuevo: Signal para rastrear si ya se envió solicitud (evita duplicados)
  solicitudEnviada = signal<boolean>(false);

  // 🎯 Nuevo: Signal para mostrar spinner mientras se procesa la solicitud
  enviandoSolicitud = signal<boolean>(false);

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

  // ========================================================================
  // MÉTODOS DEL CICLO DE VIDA
  // ========================================================================

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

      this.participationService.getParticipantsByTripId(this.viaje.id).subscribe({
        next: (res: any) => {
          const data = Array.isArray(res.data) ? res.data : [];

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
            error: (err) => {
              console.error('Error al obtener participantes', err);
            },
          });
        },
      });

      this.cargarImagenes(Number(id));
    } catch (error) {
      this.viaje = null;
      this.usuario = null;
      this.itinerarioPorDia = [];
    }
  }

  get esCreador(): boolean {
    return this.usuarioActual?.id === this.viaje?.creator_id;
  }

  // ========================================================================
  // MÉTODOS DE PARTICIPACIÓN
  // ========================================================================

  /**
   * Método para solicitar unirse a un viaje
   *
   * Flujo:
   * 1. Validar que el usuario no sea el creador
   * 2. Activar estado de carga
   * 3. Llamar al servicio ParticipantService.requestToJoinTrip()
   * 4. Si es exitoso: mostrar toast con el mensaje del API
   * 5. Si falla: mostrar toast de error
   * 6. Actualizar estado del botón
   *
   * @async
   */
  async handleSolicitud() {
    // ✅ Validación 1: Verificar que el usuario esté autenticado
    if (!this.usuarioActual) {
      toast.error('Debes iniciar sesión para solicitar unirte');
      this.router.navigate(['/login']);
      return;
    }

    // ✅ Validación 2: Verificar que el viaje exista
    if (!this.viaje?.id) {
      toast.error('El viaje no existe o no se cargó correctamente');
      return;
    }

    // ✅ Validación 3: Verificar que no sea el creador
    if (this.esCreador) {
      toast.error('No puedes solicitar unirte a tu propio viaje');
      return;
    }

    // ✅ Validación 4: Prevenir solicitudes duplicadas
    if (this.solicitudEnviada() || this.enviandoSolicitud()) {
      toast.info('Ya has enviado una solicitud para este viaje');
      return;
    }

    try {
      // 🔄 Activar estado de carga (mostrar spinner)
      this.enviandoSolicitud.set(true);

      // 📡 Realizar la petición al servidor
      const response = await firstValueFrom(
        this.participantService.requestToJoinTrip(this.viaje.id)
      );

      // ✅ Si la respuesta es exitosa
      // Mostrar el mensaje del API en un toast
      toast.success(response.message, {
        description: 'Tu solicitud ha sido registrada',
      });

      // 🎯 Marcar que la solicitud fue enviada
      this.solicitudEnviada.set(true);

      // 💬 Log para debugging
      console.log('✅ Solicitud de participación exitosa:', response.data);
    } catch (error: any) {
      // ❌ Manejar error
      const errorMsg = error?.message || 'Error al enviar la solicitud de participación';

      console.error('❌ Error en handleSolicitud:', error);

      toast.error(errorMsg, {
        description: 'Por favor, intenta de nuevo más tarde',
      });
    } finally {
      // 🔄 Desactivar estado de carga
      this.enviandoSolicitud.set(false);
    }
  }

  async eliminarViaje() {
    if (!this.viaje?.id) {
      alert('El viaje no tiene un ID válido.');
      return;
    }
    if (confirm('¿Seguro que quieres eliminar este viaje?')) {
      try {
        await firstValueFrom(this.tripService.deleteTripById(this.viaje.id));
        this.router.navigate(['/home']);
      } catch (error) {
        alert('No se pudo eliminar el viaje.');
      }
    }
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
  getGoogleMapsUrl(lat: number, lng: number, zoom: number): string {
    return `https://www.google.com/maps/@${lat},${lng},${zoom}z`;
  }
}
