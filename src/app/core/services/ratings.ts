import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class RatingsService {
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
    return this.http.get<any[]>(`${environment.apiUrl}/ratings`, { headers: this.getHeaders() });
  }

  // Obtener valoración por ID
  getRatingById(id: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/ratings/${id}`, {
      headers: this.getHeaders(),
    });
  }

  // Obtener valoraciones por viaje
  getRatingsByTrip(tripId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/trip/${tripId}`, {
      headers: this.getHeaders(),
    });
  }

  // Obtener valoraciones por autor
  getRatingsByAuthor(authorId: number): Observable<any[]> {
    return this.http
      .get<any>(`${environment.apiUrl}/ratings/author/${authorId}`, {
        headers: this.getHeaders(),
      })
      .pipe(map((resp) => resp.results?.results ?? []));
  }

  // Obtener valoraciones por usuario valorado
  getRatingsByRatedUser(ratedUserId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/rated_user/${ratedUserId}`, {
      headers: this.getHeaders(),
    });
  }

  // Obtener puntuación media de un usuario
  getRatingScoreByRatedUser(ratedUserId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/score/${ratedUserId}`, {
      headers: this.getHeaders(),
    });
  }

  // Crear valoración
  createRating(ratingData: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/ratings`, ratingData, {
      headers: this.getHeaders(),
    });
  }

  // Actualizar valoración
  updateRating(id: number, ratingData: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/ratings/${id}`, ratingData, {
      headers: this.getHeaders(),
    });
  }

  // Eliminar valoración
  deleteRating(id: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/ratings/${id}`, {
      headers: this.getHeaders(),
    });
  }
}
