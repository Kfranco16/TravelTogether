import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth';
import { FavoritesService } from '../../../core/services/favorites.service';

@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './favoritos.html',
  styleUrl: './favoritos.css',
})
export class Favoritos {
  private auth = inject(AuthService);
  private favoritesService = inject(FavoritesService);

  loading = true;
  error: string | null = null;
  favoritos: any[] = [];

  async ngOnInit() {
    const user = this.auth.getCurrentUser();
    const token = this.auth.gettoken();

    if (!user || !token) {
      this.loading = false;
      this.error = 'No se ha podido identificar al usuario.';
      return;
    }

    this.favoritesService.getFavoritesByUser(user.id, token).subscribe({
      next: (data) => {
        this.favoritos = data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar favoritos', err);
        this.error = 'No se han podido cargar tus favoritos.';
        this.loading = false;
      },
    });
  }
}
