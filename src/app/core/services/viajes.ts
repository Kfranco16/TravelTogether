import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trip } from '../../interfaces/trip';
import { HttpParams } from '@angular/common/http';

// Interfaz para la respuesta paginada completa
export interface TripApiResponse {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  results: Trip[];
}

@Injectable({ providedIn: 'root' })
export class TripService {
  private apiUrl = 'http://localhost:3000/api/trips';

  constructor(private http: HttpClient) {}

  getTrips(token: string): Observable<TripApiResponse> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<TripApiResponse>(this.apiUrl, { headers });
  }

  //mis viajes (viajes creados por el usuario)
  getMisViajes(userId: number): Observable<Trip[]> {
    const token = localStorage.getItem('tt_token') || '';
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    const params = new HttpParams().set('owner_id', String(userId));
    // reutilizamos /trips con filtro por owner_id (back debe soportarlo)
    return this.http.get<Trip[]>(this.apiUrl, { headers, params });
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
    return this.http.get<any[]>('http://localhost:3000/api/favorites', { headers, params });
  }
}
