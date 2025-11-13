import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
//import { if, for } from '@angular/common';

import { AuthService } from '../../core/services/auth';
import { Iuser } from '../../interfaces/iuser';
import { TripService } from '../../core/services/viajes';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit {
  // Servicios
  private auth = inject(AuthService);
  private trips = inject(TripService);

  // Estado expuesto a la vista
  user: Iuser | null = null;
  misViajes: any[] = [];
  misReservas: any[] = [];
  favoritos: any[] = [];
  notificaciones: any[] = [];
  cargando = true;

  ngOnInit(): void {
    this.user = this.auth.getCurrentUser();
    const id = this.user?.id;

    if (!id) {
      this.cargando = false;
      return;
    }

    (this.trips as any).getMisViajes?.(id)?.subscribe({
      next: (data: any[] = []) => (this.misViajes = data),
      error: () => (this.misViajes = []),
    });

    (this.trips as any).getMisReservas?.(id)?.subscribe({
      next: (data: any[] = []) => (this.misReservas = data),
      error: () => (this.misReservas = []),
    });

    (this.trips as any).getFavoritos?.(id)?.subscribe({
      next: (data: any[] = []) => (this.favoritos = data),
      error: () => (this.favoritos = []),
    });

    // Temporal: simulamos notificaciones hasta que Back exponga endpoint
    this.notificaciones = [
      { id: 'a', texto: 'Tienes nuevas solicitudes en un viaje.', fecha: 'hoy' },
      { id: 'b', texto: 'Perfil actualizado correctamente.', fecha: 'ayer' },
    ];

    setTimeout(() => (this.cargando = false), 200);
  }
}
