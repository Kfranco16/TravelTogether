import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment';
import { Observable } from 'rxjs';

export interface Favorite {
  id: number;
  trip_id: number;
  user_id: number;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  private http = inject(HttpClient);

  getFavoritesByUser(userId: number, token: string): Observable<Favorite[]> {
    return this.http.get<Favorite[]>(`${environment.apiUrl}/favorites/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  addFavorite(tripId: number, token: string): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/favorites`,
      { trip_id: tripId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  removeFavoriteById(favoriteId: number, token: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/favorites/${favoriteId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  isFavoriteByTrip(tripId: number, token: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/favorites/trip/${tripId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }
}
