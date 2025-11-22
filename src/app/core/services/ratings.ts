import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class RatingsService {
  private apiUrl = `${environment.apiUrl}/ratings`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  // Obtener todas las valoraciones
  getAllRatings(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  // Obtener valoración por ID
  getRatingById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // Obtener valoraciones por viaje
  getRatingsByTrip(tripId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/trip/${tripId}`, { headers: this.getHeaders() });
  }

  // Obtener valoraciones por autor
  getRatingsByAuthor(authorId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/author/${authorId}`, {
      headers: this.getHeaders(),
    });
  }

  // Obtener valoraciones por usuario valorado
  getRatingsByRatedUser(ratedUserId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/rated_user/${ratedUserId}`, {
      headers: this.getHeaders(),
    });
  }

  // Obtener puntuación media de un usuario
  getRatingScoreByRatedUser(ratedUserId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/score/${ratedUserId}`, {
      headers: this.getHeaders(),
    });
  }

  // Crear valoración
  createRating(ratingData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, ratingData, { headers: this.getHeaders() });
  }

  // Actualizar valoración
  updateRating(id: number, ratingData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, ratingData, { headers: this.getHeaders() });
  }

  // Eliminar valoración
  deleteRating(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
