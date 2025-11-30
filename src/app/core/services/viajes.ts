import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { Trip } from '../../interfaces/trip';
import { HttpParams } from '@angular/common/http';
import { environment } from '../../../environment/environment';

export interface TripApiResponse {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  results: Trip[];
}

export interface ImageResponse {
  id: number;
  trip_id: number;
  user_id: number;
  image_url: string;
  description: string;
  main_img: string;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class TripService {
  private http = inject(HttpClient);

  getTrips(token: string): Observable<TripApiResponse> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<TripApiResponse>(`${environment.apiUrl}/trips`, { headers });
  }

  async getTripById(id: number): Promise<Trip> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const url = `${environment.apiUrl}/trips/${id}`;
    return firstValueFrom(this.http.get<Trip>(url, { headers }));
  }

  async createTrip(tripData: any): Promise<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const url = `${environment.apiUrl}/trips/`;
    return await firstValueFrom(this.http.post<any>(url, tripData, { headers }));
  }
  getAllTrips(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/trips/`);
  }

  deleteTripById(id: number) {
    return this.http.delete(`${environment.apiUrl}/trips/${id}`);
  }

  getImagesByTripId(tripId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/images/trips/${tripId}`);
  }

  getParticipantsByTripId(tripId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/participations/trip/${tripId}`);
  }

  // Crear favorito para un viaje
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

  // Borrar favorito por ID de favorito (DELETE /favorites/:favoriteId)
  removeFavoriteById(favoriteId: number, token: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/favorites/${favoriteId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // Comprobar si un viaje concreto es favorito (GET /favorites/trip/:tripId)
  isFavoriteByTrip(tripId: number, token: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/favorites/trip/${tripId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  getFavoritesByUser(userId: number, token: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/favorites/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async uploadImage(
    file: File,
    description: string,
    tripId: number,
    userId: number,
    mainImg: boolean
  ): Promise<any> {
    const url = `${environment.apiUrl}/images/upload`;
    const formData = new FormData();
    formData.append('image', file);
    formData.append('trip_id', tripId.toString());
    formData.append('user_id', userId.toString());
    formData.append('description', description);
    formData.append('main_img', mainImg ? '1' : '0');

    const token = localStorage.getItem('authToken');
    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers,
    });

    if (!response.ok) {
      throw new Error('Error al subir imagen: ' + response.statusText);
    }

    return await response.json();
  }

  //mis viajes (viajes creados por el usuario)
  getMisViajes(userId: number): Observable<Trip[]> {
    const token = localStorage.getItem('tt_token') || '';
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    const params = new HttpParams().set('owner_id', String(userId));
    // reutilizamos /trips con filtro por owner_id (back debe soportarlo)
    return this.http.get<Trip[]>(environment.apiUrl + '/trips', { headers, params });
  }

  //mis reservas
  getMisReservas(userId: number): Observable<any[]> {
    const token = localStorage.getItem('tt_token') || '';
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    const params = new HttpParams().set('user_id', String(userId));
    return this.http.get<any[]>('http://localhost:3000/api/bookings', { headers, params });
  }

  // favoritos de usuario
  getFavoritos(userId: number): Observable<any[]> {
    const token = localStorage.getItem('tt_token') || '';
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    const params = new HttpParams().set('user_id', String(userId));
    return this.http.get<any[]>(environment.apiUrl + '/favorites', { headers, params });
  }
}
