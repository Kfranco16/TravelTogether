import { Component, inject, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TripService } from '../../core/services/viajes';
import { Trip } from '../../interfaces/trip';
import { DatePipe } from '@angular/common';
import { Iuser } from '../../interfaces/iuser';
import { Router, RouterLink } from '@angular/router';

import { CardUsuario } from '../../components/card-usuario/card-usuario';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-detalle-viaje',
  standalone: true,
  imports: [DatePipe, CardUsuario, RouterLink],
  templateUrl: './detalle-viaje.html',
  styleUrl: './detalle-viaje.css',
})
export class DetalleViaje {
  @Input() trip!: any;

  constructor(private authService: AuthService, private router: Router) {}

  private route = inject(ActivatedRoute);
  private tripService = inject(TripService);

  viaje: Trip | null = null;
  usuario: Iuser | null = null;

  public itinerarioPorDia: string[] = [];

  toggleSolicitud(trip: any) {
    trip.solicitado = !trip.solicitado;
    // Futura llamada a la API para la solicitud de unirse al viaje.
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    try {
      // 1. Carga el viaje
      this.viaje = await this.tripService.getTripById(Number(id));

      // 2. Procesa el itinerario en array de días
      if (this.viaje?.itinerary) {
        this.itinerarioPorDia = this.viaje.itinerary
          .split('Día')
          .map((d) => d.trim())
          .filter((d) => d !== '')
          .map((d) => 'Día ' + d);
      } else {
        this.itinerarioPorDia = [];
      }

      // 3. Cuando tengas el viaje, busca el usuario creador
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
