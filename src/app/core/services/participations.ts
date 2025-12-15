import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environment/environment';
import { of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ParticipationService {
  constructor(private http: HttpClient) {}

  getMyCreatedTrips(): Observable<any[]> {
    const url = `${environment.apiUrl}/participations/my-created`;
    return this.http.get<any[]>(url);
  }

  getMyParticipations(): Observable<any[]> {
    const url = `${environment.apiUrl}/participations/my-participations`;
    return this.http.get<any[]>(url);
  }

  getParticipantsByTripId(tripId: number): Observable<any[]> {
    const url = `${environment.apiUrl}/participations/trip/${tripId}`;
    return this.http.get<any[]>(url);
  }

  checkIfRequestExists(tripId: number, userId: number) {
    return this.http.get<{ exists: boolean }>(
      `${environment.apiUrl}/trips/${tripId}/participants/${userId}/request`
    );
  }

  getParticipantsByTripIdWithImages(tripId: number): Observable<any[]> {
    return this.getParticipantsByTripId(tripId).pipe(
      switchMap((response: any) => {
        const participants: any[] = Array.isArray(response) ? response : response.data || [];

        const uniqueParticipants = Array.from(
          new Map(participants.map((p) => [p.user_id, p])).values()
        );

        if (uniqueParticipants.length === 0) {
          return of([]);
        }

        const userRequests = uniqueParticipants.map((participant: any) =>
          this.getUserData(participant.user_id).pipe(
            map((user) => ({
              ...participant,
              user_image_url: user.image,
              phone: user.phone,
              bio: user.bio,
              interests: user.interests,
            }))
          )
        );

        return forkJoin(userRequests);
      })
    );
  }

  private getUserData(userId: number): Observable<any> {
    const url = `${environment.apiUrl}/users/${userId}`;
    return this.http.get<any>(url);
  }

  createParticipation(tripId: number, token: string): Observable<any> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.post<any>(
      `${environment.apiUrl}/participations/trip`,
      { tripId },
      { headers }
    );
  }

  updateParticipationStatus(
    participationId: number,
    newStatus: string,
    token: string
  ): Observable<any> {
    const url = `${environment.apiUrl}/participations/status/${participationId}`;
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.put<any>(url, { newStatus }, { headers });
  }

  deleteParticipation(participationId: number, token: string): Observable<any> {
    const url = `${environment.apiUrl}/participations/${participationId}`;
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.delete<any>(url, { headers });
  }
}
