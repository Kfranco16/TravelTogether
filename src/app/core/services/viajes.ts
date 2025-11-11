import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { Trip } from '../../interfaces/trip';

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

  async getTripById(id: number): Promise<Trip> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const url = `${this.apiUrl}/${id}`;
    return firstValueFrom(this.http.get<Trip>(url, { headers }));
  }
}
