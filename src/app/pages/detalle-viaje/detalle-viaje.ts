import { Component, inject, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TripService } from '../../core/services/viajes';
import { Trip } from '../../interfaces/trip';
import { DatePipe } from '@angular/common';
import { Iuser } from '../../interfaces/iuser';
import { Router, RouterLink } from '@angular/router';

import { CardUsuario } from '../../components/card-usuario/card-usuario';
import { AuthService } from '../../core/services/auth';
import { FormGroup } from '@angular/forms';

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

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.usuarioActual = this.authService.getCurrentUser();
    if (!id) return;

    try {
      this.viaje = await this.tripService.getTripById(Number(id));

      if (this.viaje?.itinerary) {
        console.log('Itinerario original:', this.viaje);
        this.itinerarioPorDia = this.viaje.itinerary
          .split('Día')
          .map((d) => d.trim())
          .filter((d) => d !== '')
          .map((d) => '' + d);
      } else {
        this.itinerarioPorDia = [];
      }

      if (this.viaje?.creator_id) {
        try {
          this.usuario = await this.authService.getUserById(this.viaje.creator_id);
          console.log('Usuario obtenido:', this.usuario);
        } catch (err) {
          console.error('Error obteniendo usuario:', err);
          this.usuario = null;
        }
      }
    } catch (error) {
      console.log(error, 'ERROR AL OBTENER EL VIAJE');
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
        await this.tripService.deleteTripById(this.viaje.id);
        this.router.navigate(['/home']);
      } catch (error) {
        console.error('Error al eliminar el viaje:', error);
        alert('No se pudo eliminar el viaje.');
      }
    }
  }

  irADetalleUsuario() {
    if (this.usuario && this.usuario.id) {
      this.router.navigate([`perfil/${this.usuario.id}`]);
    }
  }

  getGoogleMapsUrl(lat: number, lng: number, zoom: number): string {
    return `https://www.google.com/maps/@${lat},${lng},${zoom}z`;
  }

  imagenes = [
    'https://plus.unsplash.com/premium_photo-1661914240950-b0124f20a5c1?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8dG9raW98ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=900', // Montañas y río, Nueva Zelanda
    'https://www.shutterstock.com/image-photo/sunrise-panorama-kyoto-japan-260nw-1262024851.jpg', // Lago helado, Islandia
  ];
}
