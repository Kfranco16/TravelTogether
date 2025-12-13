import { Component, inject, Input, SimpleChanges } from '@angular/core';
import { AuthService } from '../../core/services/auth';
import { Iuser } from '../../interfaces/iuser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TripService } from '../../core/services/viajes';
import { Trip } from '../../interfaces/trip';

@Component({
  selector: 'app-perfil',
  imports: [RouterLink, DatePipe],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil {
  portadas: Record<number, { url: string; alt: string }> = {};

  usuario: Iuser | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private tripService: TripService
  ) {}

  userTrips: Trip[] = [];
  private route = inject(ActivatedRoute);

  isLoadingTrips = false;

  usuarioValoracion: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuario'] && this.usuario && this.usuario.id) {
      const token = localStorage.getItem('tt_token') || '';
      this.authService.getUserRating(this.usuario.id, token).subscribe({
        next: (rating: number) => {
          this.usuarioValoracion = rating;
        },
        error: () => {
          this.usuarioValoracion = null;
        },
      });
    }
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const token = localStorage.getItem('tt_token') || '';

    try {
      if (id) {
        const profileUserId = Number(id);

        this.usuario = await this.authService.getUserById(profileUserId);

        this.loadUserTrips(profileUserId);
      }

      if (this.usuario && typeof this.usuario.interests === 'string') {
        this.usuario.interests = this.usuario.interests.split(',').map((i: string) => i.trim());
        this.authService.getUserRating(this.usuario.id, token).subscribe({
          next: (rating: number) => {
            console.log('Valoración recibida:', rating);
            this.usuarioValoracion = rating;
          },
          error: () => {
            this.usuarioValoracion = null;
          },
        });
      }
    } catch (error) {
      console.log(error, 'ERROR AL OBTENER EL USUARIO');
    }
  }

  loadUserTrips(profileUserId: number): void {
    this.isLoadingTrips = true;

    this.tripService.getTripsByCreator(profileUserId).subscribe({
      next: (response: { results: Trip[] }) => {
        this.userTrips = response?.results || [];
        this.isLoadingTrips = false;

        this.userTrips.forEach((trip) => {
          if (trip.id) {
            this.cargarPortadaDeTrip(trip.id, trip.title);
          }
        });
      },
      error: (err) => {
        console.error('Error cargando viajes del usuario', err);
        this.userTrips = [];
        this.isLoadingTrips = false;
      },
    });
  }

  private cargarPortadaDeTrip(tripId: number, tripTitle: string): void {
    this.tripService.getImagesByTripId(tripId).subscribe({
      next: (data: any) => {
        const fotos: any[] = data?.results?.results || [];
        const fotoPortada = fotos.find((f) => f.main_img == '0' || f.main_img == 0);

        this.portadas[tripId] = {
          url: fotoPortada?.url || 'images/coverDefault.jpg',
          alt: fotoPortada?.description || tripTitle || 'Imagen de portada',
        };
      },
      error: () => {
        this.portadas[tripId] = {
          url: 'images/coverDefault.jpg',
          alt: tripTitle || 'Imagen de portada',
        };
      },
    });
  }

  irAValoraciones() {
    if (this.usuario && this.usuario.id) {
      this.router.navigate([`valoraciones/${this.usuario.id}`]);
    }
  }

  getEstrellas(valoracion: number): { icon: string; color: string }[] {
    if (valoracion <= 2) {
      return [
        { icon: 'bi-star-fill', color: 'text-danger' },
        { icon: 'bi-star', color: 'text-secondary' },
        { icon: 'bi-star', color: 'text-secondary' },
      ];
    } else if (valoracion <= 3) {
      return [
        { icon: 'bi-star-fill', color: 'text-warning' },
        { icon: 'bi-star', color: 'text-secondary' },
        { icon: 'bi-star', color: 'text-secondary' },
      ];
    } else if (valoracion <= 4) {
      return [
        { icon: 'bi-star-fill', color: 'text-warning' },
        { icon: 'bi-star-fill', color: 'text-warning' },
        { icon: 'bi-star', color: 'text-secondary' },
      ];
    } else {
      return [
        { icon: 'bi-star-fill', color: 'text-warning' },
        { icon: 'bi-star-fill', color: 'text-warning' },
        { icon: 'bi-star-fill', color: 'text-warning' },
      ];
    }
  }
}
