import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface ParticipationRequest {
  id: number;
  status: 'pending' | 'accepted' | 'rejected';
  request_date: string;
  response_date: string | null;
  user_id: number;
  trip_id: number;
}

export interface ParticipationRequestResponse {
  message: string;
  data: ParticipationRequest;
}

export interface PendingParticipationInfo {
  creator_id: any;
  participation_id: number;
  status: string;
  request_date: string;
  response_date: string | null;
  trip_id: number;
  trip_name: string;
  participant_user_id: number;
  participant_username: string;
  participant_email: string;
  trip_image_url: string | null;
  participant_image_url: string | null;
  participant_avg_score: string;
}

export interface PendingParticipationsResponse {
  message: string;
  data: PendingParticipationInfo[];
}

export interface UpdateParticipationStatusResponse {
  message: string;
  data: ParticipationRequest;
}

export interface AcceptedParticipant {
  id: number;
  username: string;
  email: string;
  status: 'accepted' | 'pending' | 'rejected';
  is_creator: number;
  participant_avg_score: number;
  participant_image_url: string | null;
}

export interface MyCreatedTrip {
  trip_id: number;
  title: string;
  origin: string;
  destination: string;
  description: string;
  start_date: string;
  end_date: string;
  estimated_cost: string;
  all_related_participants: AcceptedParticipant[];
  current_participants: number;
  capacity: number;
}

export interface MyCreatedTripsResponse {
  message: string;
  data: MyCreatedTrip[];
}

export interface UserParticipation {
  participation_id: number;
  status: 'pending' | 'accepted' | 'rejected';
  request_date: string;
  response_date: string | null;
  trip_id: number;
  trip_name: string;
  origin: string;
  destination: string;
  start_date: string;
  end_date: string;
  creator_id: number;
  creator_username: string;
  creator_email: string;
  creator_image_url: string | null;
  trip_image_url: string | null;
  creator_avg_score: string;
}

export interface UserParticipationsResponse {
  message: string;
  data: UserParticipation[];
}

export interface TripParticipation {
  participation_id: number;
  status: 'pending' | 'accepted' | 'rejected';
  request_date: string;
  response_date: string | null;
  user_id: number;
  username: string;
  email: string;
  user_image_url: string | null;
  user_avg_score: string;
}

export interface TripParticipationsResponse {
  message: string;
  data: TripParticipation[];
}

export interface DeleteParticipantResponse {
  message: string;
  data: {
    userId: number;
    tripId: number;
    participationId: string | number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ParticipantService {
  private http = inject(HttpClient);

  pendingParticipations = signal<PendingParticipationInfo[]>([]);

  myCreatedTrips = signal<MyCreatedTrip[]>([]);

  userParticipations = signal<UserParticipation[]>([]);

  loadingSignal = signal<boolean>(false);

  errorSignal = signal<string | null>(null);

  private tripParticipationsMap = new Map<number, TripParticipation[]>();

  requestToJoinTrip(tripId: number): Observable<ParticipationRequestResponse> {
    const token = localStorage.getItem('tt_token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    const body = { tripId };

    return this.http
      .post<ParticipationRequestResponse>(`${environment.apiUrl}/participations`, body, {
        headers,
      })
      .pipe(
        tap((response) => {
          this.errorSignal.set(null);
        }),
        catchError((error) => {
          const errorMsg = error?.error?.message || 'Error al solicitar unirse al viaje';
          this.errorSignal.set(errorMsg);
          return throwError(() => ({
            message: errorMsg,
            error,
          }));
        })
      );
  }

  getPendingParticipations(): Observable<PendingParticipationsResponse> {
    const token = localStorage.getItem('tt_token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.loadingSignal.set(true);

    return this.http
      .get<PendingParticipationsResponse>(`${environment.apiUrl}/participations/pending`, {
        headers,
      })
      .pipe(
        tap((response) => {
          this.pendingParticipations.set(response.data);
          this.loadingSignal.set(false);
          this.errorSignal.set(null);
        }),

        catchError((error) => {
          const errorMsg = error?.error?.message || 'Error al obtener solicitudes pendientes';
          console.error(' Error en getPendingParticipations:', errorMsg);
          this.errorSignal.set(errorMsg);
          this.loadingSignal.set(false);
          return throwError(() => ({
            message: errorMsg,
            error,
          }));
        })
      );
  }

  approveParticipant(participationId: number): Observable<UpdateParticipationStatusResponse> {
    const token = localStorage.getItem('tt_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    const body = { newStatus: 'accepted' };

    return this.http
      .put<UpdateParticipationStatusResponse>(
        `${environment.apiUrl}/participations/status/${participationId}`,
        body,
        {
          headers,
        }
      )
      .pipe(
        tap((response) => {
          this.errorSignal.set(null);
        }),
        catchError((error) => {
          const errorMsg = error?.error?.message || 'Error al aprobar participante';
          console.error('Error en approveParticipant:', errorMsg);
          this.errorSignal.set(errorMsg);
          return throwError(() => ({
            message: errorMsg,
            error,
          }));
        })
      );
  }

  rejectParticipant(participationId: number): Observable<UpdateParticipationStatusResponse> {
    const token = localStorage.getItem('tt_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    const body = { newStatus: 'rejected' };

    return this.http
      .put<UpdateParticipationStatusResponse>(
        `${environment.apiUrl}/participations/status/${participationId}`,
        body,
        {
          headers,
        }
      )
      .pipe(
        tap((response) => {
          this.errorSignal.set(null);
        }),
        catchError((error) => {
          const errorMsg = error?.error?.message || 'Error al rechazar participante';
          console.error(' Error en rejectParticipant:', errorMsg);
          this.errorSignal.set(errorMsg);
          return throwError(() => ({
            message: errorMsg,
            error,
          }));
        })
      );
  }

  getMyCreatedTripsWithParticipants(): Observable<MyCreatedTripsResponse> {
    const token = localStorage.getItem('tt_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.loadingSignal.set(true);

    return this.http
      .get<MyCreatedTripsResponse>(`${environment.apiUrl}/participations/my-created`, {
        headers,
      })
      .pipe(
        tap((response) => {
          this.myCreatedTrips.set(response.data);
          this.loadingSignal.set(false);
          this.errorSignal.set(null);
        }),
        catchError((error) => {
          const errorMsg = error?.error?.message || 'Error al obtener viajes creados';
          console.error(' Error en getMyCreatedTripsWithParticipants:', errorMsg);
          this.errorSignal.set(errorMsg);
          this.loadingSignal.set(false);
          return throwError(() => ({
            message: errorMsg,
            error,
          }));
        })
      );
  }

  getMyParticipations(): Observable<UserParticipationsResponse> {
    const token = localStorage.getItem('tt_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.loadingSignal.set(true);

    return this.http
      .get<UserParticipationsResponse>(`${environment.apiUrl}/participations/my-participations`, {
        headers,
      })
      .pipe(
        tap((response) => {
          this.userParticipations.set(response.data);
          this.loadingSignal.set(false);
          this.errorSignal.set(null);
        }),

        catchError((error) => {
          const errorMsg = error?.error?.message || 'Error al obtener tus participaciones';
          console.error('Error en getMyParticipations:', errorMsg);
          this.errorSignal.set(errorMsg);
          this.loadingSignal.set(false);
          return throwError(() => ({
            message: errorMsg,
            error,
          }));
        })
      );
  }

  getTripParticipations(tripId: number): Observable<TripParticipationsResponse> {
    const token = localStorage.getItem('tt_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.loadingSignal.set(true);

    return this.http
      .get<TripParticipationsResponse>(`${environment.apiUrl}/participations/trip/${tripId}`, {
        headers,
      })
      .pipe(
        tap((response) => {
          this.tripParticipationsMap.set(tripId, response.data);
          this.loadingSignal.set(false);
          this.errorSignal.set(null);
        }),
        catchError((error) => {
          const errorMsg = error?.error?.message || 'Error al obtener participantes del viaje';
          console.error('Error en getTripParticipations:', errorMsg);
          this.errorSignal.set(errorMsg);
          this.loadingSignal.set(false);
          return throwError(() => ({
            message: errorMsg,
            error,
          }));
        })
      );
  }

  getCachedTripParticipations(tripId: number): TripParticipation[] | undefined {
    return this.tripParticipationsMap.get(tripId);
  }

  deleteParticipant(participationId: number): Observable<DeleteParticipantResponse> {
    const token = localStorage.getItem('tt_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    return this.http
      .delete<DeleteParticipantResponse>(
        `${environment.apiUrl}/participations/${participationId}`,
        {
          headers,
        }
      )
      .pipe(
        tap((response) => {
          const tripId = response.data.tripId;
          this.tripParticipationsMap.delete(tripId);
          this.errorSignal.set(null);
        }),
        catchError((error) => {
          const errorMsg = error?.error?.message || 'Error al eliminar participante';
          console.error('Error en deleteParticipant:', errorMsg);
          this.errorSignal.set(errorMsg);
          return throwError(() => ({
            message: errorMsg,
            error,
          }));
        })
      );
  }

  reset(): void {
    this.pendingParticipations.set([]);
    this.myCreatedTrips.set([]);
    this.userParticipations.set([]);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
    this.tripParticipationsMap.clear();
  }
}
