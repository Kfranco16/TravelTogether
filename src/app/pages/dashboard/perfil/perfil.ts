import { Component, inject } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth';
import { Iuser } from '../../../interfaces/iuser';

interface Rating {
  id: number;
  score: number; // 1–5
  comment: string;
  from: string;
  createdAt: string;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [DecimalPipe, DatePipe],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.css'],
})
export class Perfil {
  private auth = inject(AuthService);

  // Avatar por defecto
  defaultAvatar = 'https://i.pravatar.cc/120?u=traveltogether';

  // Usuario actual
  user: Iuser | null = null;

  // Valoraciones del usuario
  ratings: Rating[] = [];
  hasRatings = false;
  averageScore = 0;
  averageStars = 0;

  constructor() {
    this.user = this.auth.getCurrentUser();

    // Si el backend viene con ratings dentro del user:
    if (this.user && (this.user as any).ratings) {
      this.ratings = (this.user as any).ratings;
    }

    this.hasRatings = this.ratings.length > 0;

    if (this.hasRatings) {
      const sum = this.ratings.reduce((acc, r) => acc + r.score, 0);
      this.averageScore = sum / this.ratings.length;
      this.averageStars = Math.round(this.averageScore);
    }
  }

  // Navegar a editar perfil
  onEditarDatos() {
    // después lo implementas cuando esté hecha la ruta
    console.log('Editar datos…');
  }

  onModificarFoto() {
    console.log('Modificar foto… (implementar)');
  }

  onGuardarCambios() {
    console.log('Guardar cambios… (implementar)');
  }
}
