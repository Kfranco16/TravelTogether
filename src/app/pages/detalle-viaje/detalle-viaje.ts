import { Component, inject, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TripService, ImageResponse } from '../../core/services/viajes';
import { Trip } from '../../interfaces/trip';
import { DatePipe } from '@angular/common';
import { Iuser } from '../../interfaces/iuser';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { CardUsuario } from '../../components/card-usuario/card-usuario';
import { AuthService } from '../../core/services/auth';

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

  viaje: Trip | null = null;
  public itinerarioPorDia: string[] = [];

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

  toggleSolicitud(trip: any) {
    trip.solicitado = !trip.solicitado;
    // Futura llamada a la API para la solicitud de unirse al viaje.
  }
  usuarioActual: Iuser | null = null;
  participantesConfirmados: any[] = [];

  mainImageUrl: string = 'images/mainDefault.jpg';
  mainImageAlt: string = 'Foto principal por defecto';
  portadaImageUrl: string = 'images/coverDefault.jpg';
  portadaImageAlt: string = 'Imagen de portada por defecto';

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
        } catch (err) {
          this.usuario = null;
        }
      }

      this.tripService.getParticipantsByTripId(this.viaje.id).subscribe({
        next: (response: any) => {
          const participantes = Array.isArray(response.data) ? response.data : [];

          this.participantesConfirmados = participantes.filter(
            (p: any) => p.status === 'accepted' && p.user_id !== this.viaje?.creator_id
          );
        },
        error: (err) => {
          console.error('Error al obtener participantes', err);
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

  irADetalleUsuario() {
    if (this.usuario && this.usuario.id) {
      this.router.navigate([`perfil/${this.usuario.id}`]);
    }
  }

  irAValoraciones() {
    if (this.usuario && this.usuario.id) {
      this.router.navigate([`valoraciones/${this.usuario.id}`]);
    }
  }
  getGoogleMapsUrl(lat: number, lng: number, zoom: number): string {
    return `https://www.google.com/maps/@${lat},${lng},${zoom}z`;
  }
}
