import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environment/environment';

/**
 * ============================================================================
 * PARTICIPATION SERVICE
 * ============================================================================
 * Servicio centralizado para gestionar la participación de usuarios en viajes.
 *
 * Responsabilidades:
 * - Solicitar unirse a viajes
 * - Obtener solicitudes pendientes (para creadores)
 * - Aprobar/Rechazar participantes
 * - Verificar estado de participación
 *
 * Este servicio es INDEPENDIENTE del foro porque la participación es un
 * concepto de negocio separado de la comunicación en el foro.
 * ============================================================================
 */

// ============================================================================
// INTERFACES / TIPOS
// ============================================================================

/**
 * Respuesta del backend cuando se crea una solicitud de participación
 */
export interface ParticipationRequest {
  id: number;
  status: 'pending' | 'accepted' | 'rejected';
  request_date: string;
  response_date: string | null;
  user_id: number;
  trip_id: number;
}

/**
 * Respuesta del backend cuando se solicita unirse a un viaje
 */
export interface ParticipationRequestResponse {
  message: string;
  data: ParticipationRequest;
}

export interface PendingParticipationInfo {
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

/**
 * Respuesta del backend cuando se obtienen solicitudes pendientes
 */
export interface PendingParticipationsResponse {
  message: string;
  data: PendingParticipationInfo[];
}

/**
 * Respuesta del backend cuando se cambia el estado de una participación
 */
export interface UpdateParticipationStatusResponse {
  message: string;
  data: ParticipationRequest;
}

/**
 * Información de participante aceptado en un viaje
 */
export interface AcceptedParticipant {
  id: number;
  username: string;
  email: string;
  status: 'accepted' | 'pending' | 'rejected';
  is_creator: number;
  participant_avg_score: number;
  participant_image_url: string | null;
}

/**
  Información de viaje creado con sus participantes aceptados
 */
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

/**
  Respuesta del backend cuando se obtienen viajes creados con participantes
 */
export interface MyCreatedTripsResponse {
  message: string;
  data: MyCreatedTrip[];
}

/**
 * Información de participación del usuario en un viaje
 * Incluye información del viaje y del creador
 */
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

/**
 * Respuesta del backend cuando se obtienen participaciones del usuario
 */
export interface UserParticipationsResponse {
  message: string;
  data: UserParticipation[];
}

/**
 * Información de participante en un viaje específico
 * Usada para obtener participation_id y eliminar participantes
 */
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

/**
 * Respuesta del backend cuando se obtienen participaciones de un viaje
 */
export interface TripParticipationsResponse {
  message: string;
  data: TripParticipation[];
}

/**
 * Respuesta del backend cuando se elimina un participante
 */
export interface DeleteParticipantResponse {
  message: string;
  data: {
    userId: number;
    tripId: number;
    participationId: string | number;
  };
}

// ============================================================================
// INJECTABLE SERVICE
// ============================================================================

@Injectable({
  providedIn: 'root',
})
export class ParticipantService {
  // ========================================================================
  // INYECCIONES DE DEPENDENCIAS
  // ========================================================================
  private http = inject(HttpClient);

  // ========================================================================
  // SIGNALS PARA REACTIVIDAD
  // ========================================================================

  /**
   * Signal que almacena las solicitudes pendientes del usuario (si es creador)
   * Se usa para actualización reactiva en tiempo real
   */
  pendingParticipations = signal<PendingParticipationInfo[]>([]);

  /**
   * Signal que almacena los viajes creados con sus participantes aceptados
   * Se usa para mostrar participantes confirmados en cada viaje
   */
  myCreatedTrips = signal<MyCreatedTrip[]>([]);

  /**
   * Signal que almacena todas las participaciones del usuario (creadas + unidos)
   * Se usa para mostrar "Mis Viajes" en el componente
   */
  userParticipations = signal<UserParticipation[]>([]);

  /**
   * Signal que indica si hay una carga en progreso
   * Útil para mostrar spinners/loaders en la UI
   */
  loadingSignal = signal<boolean>(false);

  /**
   * Signal que almacena mensajes de error
   * Se puede usar para mostrar notificaciones de error
   */
  errorSignal = signal<string | null>(null);

  /**
   * Map que almacena las participaciones de cada viaje
   * Clave: trip_id, Valor: array de participaciones
   * Se usa para acceso rápido sin necesidad de múltiples peticiones
   */
  private tripParticipationsMap = new Map<number, TripParticipation[]>();

  // ========================================================================
  // MÉTODOS PÚBLICOS
  // ========================================================================

  /**
   * Solicitar unirse a un viaje específico
   *
   * Llamada al endpoint: POST {apiUrl}/participations
   * Body: { "tripId": number }
   *
   * @param tripId - ID del viaje al que el usuario quiere unirse
   * @returns Observable con la respuesta del backend
   *
   * @example
   * this.participantService.requestToJoinTrip(5).subscribe({
   *   next: (response) => console.log(response.message),
   *   error: (error) => console.error(error.message)
   * });
   */
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

  /**
   * Obtener todas las solicitudes pendientes de participación para viajes que el usuario creó
   *
   * Llamada al endpoint: GET {apiUrl}/participations/pending
   * Header: Authorization: Bearer {token}
   *
   * IMPORTANTE: Solo el creador del viaje puede ver las solicitudes pendientes
   *
   * @returns Observable con la respuesta del backend
   *
   * @example
   * this.participantService.getPendingParticipations().subscribe({
   *   next: (response) => {
   *     console.log(response.message);
   *     console.log(response.data); // Array de solicitudes
   *   },
   *   error: (error) => console.error(error.message)
   * });
   */
  getPendingParticipations(): Observable<PendingParticipationsResponse> {
    // Obtener el token del localStorage
    const token = localStorage.getItem('tt_token');

    // Crear headers con autorización
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    // Activar estado de carga
    this.loadingSignal.set(true);

    return this.http
      .get<PendingParticipationsResponse>(`${environment.apiUrl}/participations/pending`, {
        headers,
      })
      .pipe(
        tap((response) => {
          // Guardar en el signal para reactividad
          this.pendingParticipations.set(response.data);
          this.loadingSignal.set(false);
          this.errorSignal.set(null);
        }),
        // Manejar errores
        catchError((error) => {
          const errorMsg = error?.error?.message || 'Error al obtener solicitudes pendientes';
          console.error('❌ Error en getPendingParticipations:', errorMsg);
          this.errorSignal.set(errorMsg);
          this.loadingSignal.set(false);
          return throwError(() => ({
            message: errorMsg,
            error,
          }));
        })
      );
  }

  /**
   * Aprobar a un participante para unirse a un viaje (solo creador)
   *
   * Llamada al endpoint: PUT {apiUrl}/participations/status/{participationId}
   * Header: Authorization: Bearer {token}
   * Body: { "newStatus": "accepted" }
   *
   * @param participationId - ID de la solicitud de participación a aprobar
   * @returns Observable con la respuesta del backend
   *
   * @example
   * this.participantService.approveParticipant(21).subscribe({
   *   next: (response) => console.log(response.message),
   *   error: (error) => console.error(error.message)
   * });
   */
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
          console.error('❌ Error en approveParticipant:', errorMsg);
          this.errorSignal.set(errorMsg);
          return throwError(() => ({
            message: errorMsg,
            error,
          }));
        })
      );
  }

  /**
   * Rechazar a un participante (solo creador)
   *
   * Llamada al endpoint: PUT {apiUrl}/participations/status/{participationId}
   * Header: Authorization: Bearer {token}
   * Body: { "newStatus": "rejected" }
   *
   * @param participationId - ID de la solicitud de participación a rechazar
   * @returns Observable con la respuesta del backend
   *
   * @example
   * this.participantService.rejectParticipant(21).subscribe({
   *   next: (response) => console.log(response.message),
   *   error: (error) => console.error(error.message)
   * });
   */
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
          console.error('❌ Error en rejectParticipant:', errorMsg);
          this.errorSignal.set(errorMsg);
          return throwError(() => ({
            message: errorMsg,
            error,
          }));
        })
      );
  }

  /**
   * Obtener todos los viajes creados por el usuario con sus participantes aceptados
   *
   * Llamada al endpoint: GET {apiUrl}/my-created
   * Header: Authorization: Bearer {token}
   *
   * @returns Observable con la respuesta del backend
   *
   * @example
   * this.participantService.getMyCreatedTripsWithParticipants().subscribe({
   *   next: (response) => {
   *     console.log(response.message);
   *     console.log(response.data); // Array de viajes con participantes
   *   },
   *   error: (error) => console.error(error.message)
   * });
   */
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
          console.error('❌ Error en getMyCreatedTripsWithParticipants:', errorMsg);
          this.errorSignal.set(errorMsg);
          this.loadingSignal.set(false);
          return throwError(() => ({
            message: errorMsg,
            error,
          }));
        })
      );
  }

  /**
   * Obtener todas las participaciones del usuario (viajes creados + viajes unidos)
   *
   * Llamada al endpoint: GET {apiUrl}/participations/my-participations
   * Header: Authorization: Bearer {token}
   *
   * Respuesta incluye:
   * - Viajes creados por el usuario (creator_id === userId logeado)
   * - Viajes a los que se unió (creator_id !== userId logeado)
   * - Estados: pending, accepted, rejected
   *
   * @returns Observable con la respuesta del backend
   *
   * @example
   * this.participantService.getMyParticipations().subscribe({
   *   next: (response) => {
   *     console.log(response.message);
   *     console.log(response.data); // Array de participaciones
   *   },
   *   error: (error) => console.error(error.message)
   * });
   */
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
          // Guardar en el signal para reactividad
          this.userParticipations.set(response.data);
          this.loadingSignal.set(false);
          this.errorSignal.set(null);
        }),
        // Manejar errores
        catchError((error) => {
          const errorMsg = error?.error?.message || 'Error al obtener tus participaciones';
          console.error('❌ Error en getMyParticipations:', errorMsg);
          this.errorSignal.set(errorMsg);
          this.loadingSignal.set(false);
          return throwError(() => ({
            message: errorMsg,
            error,
          }));
        })
      );
  }

  /**
   * Obtener todas las participaciones de un viaje específico
   *
   * Llamada al endpoint: GET {apiUrl}/participations/trip/{tripId}
   * Header: Authorization: Bearer {token}
   *
   * IMPORTANTE: Se usa para obtener el participation_id necesario para eliminar participantes
   *
   * @param tripId - ID del viaje
   * @returns Observable con la respuesta del backend
   *
   * @example
   * this.participantService.getTripParticipations(5).subscribe({
   *   next: (response) => {
   *     console.log(response.data); // Array con participation_id
   *   },
   *   error: (error) => console.error(error.message)
   * });
   */
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
          // Guardar en el Map para acceso rápido
          this.tripParticipationsMap.set(tripId, response.data);
          this.loadingSignal.set(false);
          this.errorSignal.set(null);
        }),
        catchError((error) => {
          const errorMsg = error?.error?.message || 'Error al obtener participantes del viaje';
          console.error('❌ Error en getTripParticipations:', errorMsg);
          this.errorSignal.set(errorMsg);
          this.loadingSignal.set(false);
          return throwError(() => ({
            message: errorMsg,
            error,
          }));
        })
      );
  }

  /**
   * Obtener participaciones cacheadas de un viaje
   * Retorna los datos del Map sin hacer petición HTTP
   *
   * @param tripId - ID del viaje
   * @returns Array de participaciones o undefined si no está en cache
   */
  getCachedTripParticipations(tripId: number): TripParticipation[] | undefined {
    return this.tripParticipationsMap.get(tripId);
  }

  /**
   * Eliminar un participante de un viaje (solo creador)
   *
   * Llamada al endpoint: DELETE {apiUrl}/participations/{participationId}
   * Header: Authorization: Bearer {token}
   * Content-Type: application/json
   *
   * @param participationId - ID de la participación a eliminar
   * @returns Observable con la respuesta del backend
   *
   * @example
   * this.participantService.deleteParticipant(21).subscribe({
   *   next: (response) => console.log(response.message),
   *   error: (error) => console.error(error.message)
   * });
   */
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
          // Invalidar cache del viaje para refrescarlo en siguiente carga
          const tripId = response.data.tripId;
          this.tripParticipationsMap.delete(tripId);
          this.errorSignal.set(null);
        }),
        catchError((error) => {
          const errorMsg = error?.error?.message || 'Error al eliminar participante';
          console.error('❌ Error en deleteParticipant:', errorMsg);
          this.errorSignal.set(errorMsg);
          return throwError(() => ({
            message: errorMsg,
            error,
          }));
        })
      );
  }

  // ========================================================================
  // MÉTODOS PRIVADOS / UTILIDADES
  // ========================================================================

  /**
   * Método para limpiar los signals y cache (útil en logout)
   *
   * @example
   * this.participantService.reset();
   */
  reset(): void {
    this.pendingParticipations.set([]);
    this.myCreatedTrips.set([]);
    this.userParticipations.set([]);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
    this.tripParticipationsMap.clear();
  }
}
