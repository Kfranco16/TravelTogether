import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth';
import { TripService } from '../../../core/services/viajes';
import { Iuser } from '../../../interfaces/iuser';

@Component({
  selector: 'app-mis-viajes',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './mis-viajes.html',
  styleUrl: './mis-viajes.css',
})
export class MisViajes {
  private auth = inject(AuthService);
  private tripsService = inject(TripService);
  private router = inject(Router);

  // Usuario actual
  user: Iuser | null = null;

  // Lista de viajes creados por el usuario
  viajes: any[] = [];

  // Estado de carga y errores
  loading = true;
  error: string | null = null;

  // Estado del modal de confirmación
  showConfirmModal = false;
  tripToDelete: any | null = null;

  async ngOnInit(): Promise<void> {
    try {
      const user = this.auth.getCurrentUser();
      if (!user) {
        this.error = 'No se ha podido identificar al usuario.';
        this.loading = false;
        return;
      }

      this.user = user;

      this.tripsService.getTripsByCreator(user.id).subscribe({
        next: (response: any) => {
          // El backend devuelve { total, trips, page, per_page }
          this.viajes = response?.trips || [];
          this.loading = false;
        },
        error: (err: any) => {
          console.error('Error al cargar tus viajes', err);
          this.error = 'No se han podido cargar tus viajes.';
          this.loading = false;
        },
      });
    } catch (err) {
      console.error('Error inesperado cargando tus viajes', err);
      this.error = 'Error inesperado cargando tus viajes.';
      this.loading = false;
    }
  }

  hasTrips(): boolean {
    return !this.loading && this.viajes.length > 0;
  }

  // Navegar al detalle de un viaje
  onOpenTrip(tripId: number): void {
    this.router.navigate(['/viaje', tripId]);
  }

  // Abrir modal de confirmación
  onAskRemoveTrip(trip: any, event: MouseEvent): void {
    event.stopPropagation();
    this.tripToDelete = trip;
    this.showConfirmModal = true;
  }

  // Cerrar modal
  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.tripToDelete = null;
  }

  // Confirmar eliminación
  onConfirmRemoveTrip(): void {
    if (!this.tripToDelete) return;

    const token = this.auth.gettoken();
    if (!token) {
      alert('No se ha podido autenticar tu sesión.');
      this.closeConfirmModal();
      return;
    }

    const tripId = this.tripToDelete.id;

    this.tripsService.deleteTripById(tripId, token).subscribe({
      next: () => {
        this.viajes = this.viajes.filter((t) => t.id !== tripId);
        this.closeConfirmModal();
      },
      error: (err: any) => {
        console.error('Error eliminando viaje', err);
        alert('No se ha podido eliminar el viaje. Inténtalo de nuevo más tarde.');
        this.closeConfirmModal();
      },
    });
  }
}
