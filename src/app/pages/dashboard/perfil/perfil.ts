import { Component, inject } from '@angular/core';
import { NgIf, NgFor, DatePipe, DecimalPipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth';
import { Iuser } from '../../../interfaces/iuser';

type Rating = {
  id: number;
  from: string;
  score: number;
  comment: string;
  createdAt: string;
};

@Component({
  selector: 'app-dashboard-perfil',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, DecimalPipe],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.css'],
})
export class Perfil {
  private auth = inject(AuthService);

  // 👤 Usuario actual (el mismo que usa la navbar)
  user: Iuser | null = this.auth.getCurrentUser();
  defaultAvatar = 'https://i.pravatar.cc/120?u=traveltogether';

  // ⭐ Valoraciones de prueba (luego vienen de back)
  ratings: Rating[] = [
    {
      id: 1,
      from: 'Laura M.',
      score: 5,
      comment: 'Una compañera de viaje increíble, muy organizada y positiva.',
      createdAt: '2025-11-01T10:00:00Z',
    },
    {
      id: 2,
      from: 'Carlos G.',
      score: 4,
      comment: 'Buen ambiente en el grupo y muy puntual.',
      createdAt: '2025-11-05T18:30:00Z',
    },
  ];

  // ¿Hay valoraciones?
  get hasRatings(): boolean {
    return this.ratings.length > 0;
  }

  // Nota media
  get averageStars(): number {
    if (!this.hasRatings) return 0;
    const total = this.ratings.reduce((sum, r) => sum + r.score, 0);
    return total / this.ratings.length;
  }

  // Botón "Modificar foto de perfil"
  onModificarFoto(): void {
    // De momento solo mostramos por consola.
    console.log('Modificar foto de perfil');
  }

  // Botón "Guardar cambios"
  onGuardarCambios(): void {
    console.log('Guardar cambios de perfil');
  }
}
