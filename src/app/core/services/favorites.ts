import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environment/environment';

export interface Favorite {
  id: number;
  user_id: number;
  trip_id: number;
  created_at: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/favorites`;

  private authHeaders(token: string) {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }),
    };
  }

  // GET /api/favorites/user/:id
  getFavoritesByUser(userId: number, token: string) {
    return this.http.get<Favorite[]>(`${this.baseUrl}/user/${userId}`, this.authHeaders(token));
  }

  // POST /api/favorites
  addFavorite(tripId: number, token: string) {
    return this.http.post<Favorite>(this.baseUrl, { trip_id: tripId }, this.authHeaders(token));
  }

  // DELETE /api/favorites/:id
  removeFavoriteById(favoriteId: number, token: string) {
    return this.http.delete<void>(`${this.baseUrl}/${favoriteId}`, this.authHeaders(token));
  }

  // GET /api/favorites/trip/:id
  isFavoriteByTrip(tripId: number, token: string) {
    return this.http.get<Favorite[]>(`${this.baseUrl}/trip/${tripId}`, this.authHeaders(token));
  }
}
