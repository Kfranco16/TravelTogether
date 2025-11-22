import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TripService, TripApiResponse } from '../../../core/services/viajes';
import { AuthService } from '../../../core/services/auth';
import { Trip } from '../../../interfaces/trip';

@Component({
  selector: 'app-mis-viajes',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mis-viajes.html',
  styleUrl: './mis-viajes.css',
})
export class MisViajes {
  private tripsService = inject(TripService);
  private auth = inject(AuthService);

  viajes: Trip[] = [];
  cargando = true;
  error: string | null = null;

  constructor() {
    const token = this.auth.gettoken();

    if (!token) {
      this.cargando = false;
      this.error = 'No hay sesión activa. Vuelve a iniciar sesión.';
      return;
    }

    this.tripsService.getTrips(token).subscribe({
      next: (res: TripApiResponse) => {
        this.viajes = res.results ?? [];
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se han podido cargar tus viajes. Inténtalo de nuevo más tarde.';
        this.cargando = false;
      },
    });
  }
}
