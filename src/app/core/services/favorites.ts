import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environment/environment';

export interface Favorite {
  id: number;
  created_at: string;
  trip: {
    id: number;
    creator_id: number;
    destination: string;
    latitude: number;
    longitude: number;
  };
}

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private http = inject(HttpClient);

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
    return this.http.get<Favorite[]>(
      `${environment.apiUrl}/favorites/user/${userId}`,
      this.authHeaders(token)
    );
  }

  // POST /api/favorites
  addFavorite(tripId: number, token: string) {
    return this.http.post<Favorite>(
      `${environment.apiUrl}/favorites`,
      { trip_id: tripId },
      this.authHeaders(token)
    );
  }

  // DELETE /api/favorites/:id
  removeFavoriteById(favoriteId: number, token: string) {
    return this.http.delete<void>(
      `${environment.apiUrl}/favorites/${favoriteId}`,
      this.authHeaders(token)
    );
  }

  // GET /api/favorites/trip/:id
  isFavoriteByTrip(tripId: number, token: string) {
    return this.http.get<Favorite[]>(
      `${environment.apiUrl}/favorites/trip/${tripId}`,
      this.authHeaders(token)
    );
  }
}
