import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import { AuthService } from '../../../core/services/auth';
import { FavoritesService } from '../../../core/services/favorites';
import { Iuser as User } from '../../../interfaces/iuser';
import { CardViaje } from '../../../components/card-viaje/card-viaje';

@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [CommonModule, DatePipe, CardViaje],
  templateUrl: './favoritos.html',
  styleUrls: ['./favoritos.css'],
})
export class Favoritos {
  private auth = inject(AuthService);
  private favoritesService = inject(FavoritesService);

  user: User | null = null;
  favoritos: any[] = [];
  loading = true;
  error: string | null = null;

  // Estado del modal de confirmación
  showModal = false;
  favToRemove: any = null;

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    const token = this.auth.gettoken();

    if (!user || !token) {
      this.loading = false;
      this.error = 'No se ha podido identificar al usuario.';
      return;
    }

    this.user = user;

    this.favoritesService.getFavoritesByUser(user.id, token).subscribe({
      next: (data: any[]) => {
        this.favoritos = data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando favoritos', err);
        this.error = 'No se han podido cargar tus favoritos.';
        this.loading = false;
      },
    });
  }
  trackByFavId(index: number, fav: any): number {
    return fav.id;
  }

  hasFavorites(): boolean {
    return !this.loading && this.favoritos.length > 0;
  }

  /* === Modal de confirmación === */

  onRemoveFavorite(fav: any): void {
    this.favToRemove = fav;
    this.showModal = true;
  }

  cancelRemove(): void {
    this.showModal = false;
    this.favToRemove = null;
  }

  confirmRemove(): void {
    if (!this.favToRemove) return;

    const fav = this.favToRemove;
    const token = this.auth.gettoken();

    if (!token) {
      console.error('No hay token disponible');
      return;
    }

    this.favoritesService.removeFavoriteById(fav.id, token).subscribe({
      next: () => {
        this.favoritos = this.favoritos.filter((f) => f.id !== fav.id);
        this.showModal = false;
        this.favToRemove = null;
      },
      error: (err) => {
        console.error('Error quitando favorito', err);
        alert('No se ha podido quitar el favorito. Inténtalo de nuevo.');
      },
    });
  }
}
