import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { Trip } from '../../interfaces/trip';
import { environment } from '../../../environment/environment';

export interface TripApiResponse {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  results: Trip[];
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

  // Crear viaje (CORREGIDO)
  async createTrip(tripData: any): Promise<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const url = `${environment.apiUrl}/trips/`;

    // Usamos firstValueFrom para convertir el Observable en Promise
    return await firstValueFrom(this.http.post<any>(url, tripData, { headers }));
  }

  deleteTripById(id: number) {
    return this.http.delete(`${environment.apiUrl}/trips/${id}`);
  }

  // Subir imagen
  async uploadImage(
    file: File,
    description: string,
    tripId: number,
    userId: number,
    mainImg: boolean
  ): Promise<any> {
    const url = `${environment.apiUrl}/images/upload`;
    const formData = new FormData();
    if (!file) {
      console.warn('No hay archivo seleccionado para subir');
      return;
    }
    formData.append('file', file);
    formData.append('description', description);
    formData.append('trip_id', tripId.toString());
    formData.append('user_id', userId.toString());
    formData.append('main_img', mainImg ? '1' : '0');

    if (!tripId || !userId) {
      throw new Error('tripId o userId está undefined en uploadImage');
    }

    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    console.log('Archivo para subir:', file); // Debería mostrar File { ... }

    return await firstValueFrom(this.http.post<any>(url, formData, { headers }));
  }
}
