import { Component, Input, SimpleChanges } from '@angular/core';
import { Iuser } from '../../interfaces/iuser';
import { AuthService } from '../../core/services/auth';
import { TripService } from '../../core/services/viajes';
import { inject } from '@angular/core';
import { Trip } from '../../interfaces/trip';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-card-usuario',
  standalone: true,
  templateUrl: './card-usuario.html',
  styleUrl: './card-usuario.css',
})
export class CardUsuario {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private tripService = inject(TripService);

  @Input() usuario: Iuser | null = null;

  @Input() trip: Trip | null = null;

  usuarioValoracion: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuario'] && this.usuario && this.usuario.id) {
      const token = localStorage.getItem('tt_token') || '';
      this.authService.getUserRating(this.usuario.id, token).subscribe({
        next: (rating: number) => {
          this.usuarioValoracion = rating;
        },
        error: (error) => {
          this.usuarioValoracion = null;
        },
      });
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

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    try {
      // this.trip = await this.tripService.getTripById(Number(id));
      console.log('Viaje:', this.trip);
      const userId = this.usuario?.id;
      const token = localStorage.getItem('tt_token') || '';
      console.log('ID del usuario:', userId);
      console.log('Token a usar:', token);

      if (userId) {
        this.authService.getUserRating(userId, token).subscribe({
          next: (rating: number) => {
            console.log('Valoración recibida:', rating);
            this.usuarioValoracion = rating;
          },
          error: (error) => {
            console.error('No se pudo obtener la valoración:', error);
            this.usuarioValoracion = null;
          },
        });
      }
    } catch (e) {
      console.error('Error obteniendo viaje:', e);
      this.trip = null;
    }
  }
}
