import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

@Injectable({ providedIn: 'root' })
export class ParticipationService {
  constructor(private http: HttpClient) {}

  // Obtener TODOS los participantes de un viaje
  getParticipantsByTripId(tripId: number): Observable<any[]> {
    const url = `${environment.apiUrl}/participations/trip/${tripId}`;

    return this.http.get<any[]>(url);
  }

  // (Opcional) Obtener TODAS las participaciones de un usuario
  getParticipationsByUserId(userId: number): Observable<any[]> {
    const url = `${environment.apiUrl}/participations/user/${userId}`;
    return this.http.get<any[]>(url);
  }

  // Invitar a un usuario a un viaje
  createParticipation(tripId: number, token: string): Observable<any> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.post<any>(`${environment.apiUrl}/participations`, { tripId }, { headers });
  }

  // Cambiar el estado de una participación (aceptar/rechazar)
  updateParticipationStatus(
    participationId: number,
    newStatus: string,
    token: string
  ): Observable<any> {
    const url = `${environment.apiUrl}/participations/status/${participationId}`;
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.put<any>(url, { newStatus }, { headers });
  }

  // Eliminar una participación (retirarse del viaje)
  deleteParticipation(participationId: number, token: string): Observable<any> {
    const url = `${environment.apiUrl}/participations/${participationId}`;
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.delete<any>(url, { headers });
  }
}
