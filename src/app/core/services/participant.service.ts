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
   * Signal que indica si hay una carga en progreso
   * Útil para mostrar spinners/loaders en la UI
   */
  loadingSignal = signal<boolean>(false);

  /**
   * Signal que almacena mensajes de error
   * Se puede usar para mostrar notificaciones de error
   */
  errorSignal = signal<string | null>(null);

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
    // Obtener el token del localStorage (agregado por auth.interceptor automáticamente)
    const token = localStorage.getItem('tt_token');

    // Crear headers con autorización
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    // Construir el body de la petición
    const body = { tripId };

    return this.http
      .post<ParticipationRequestResponse>(`${environment.apiUrl}/participations`, body, {
        headers,
      })
      .pipe(
        // Log exitoso para debugging
        tap((response) => {
          console.log('✅ Solicitud de participación creada:', response);
          // Limpiar cualquier error anterior
          this.errorSignal.set(null);
        }),
        // Manejar errores
        catchError((error) => {
          const errorMsg = error?.error?.message || 'Error al solicitar unirse al viaje';
          console.error('❌ Error en requestToJoinTrip:', errorMsg);
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
        // Si la respuesta es exitosa
        tap((response) => {
          console.log('✅ Solicitudes pendientes obtenidas:', response);
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
          console.log('✅ Participante aprobado:', response);
          this.errorSignal.set(null);
          // Recargar solicitudes pendientes después de aprobar
          this.refreshPendingParticipations();
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
          console.log('✅ Participante rechazado:', response);
          this.errorSignal.set(null);
          // Recargar solicitudes pendientes después de rechazar
          this.refreshPendingParticipations();
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
          console.log('✅ Viajes creados obtenidos:', response);
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

  // ========================================================================
  // MÉTODOS PRIVADOS / UTILIDADES
  // ========================================================================

  /**
   * Método privado para refrescar las solicitudes pendientes
   * Se utiliza después de aprobar o rechazar un participante
   * para mantener los datos sincronizados
   *
   * @private
   */
  private refreshPendingParticipations(): void {
    // Hacer petición silenciosa para actualizar datos
    firstValueFrom(this.getPendingParticipations()).catch((error) => {
      console.warn('No se pudieron refrescar las solicitudes:', error);
    });
  }

  /**
   * Método para limpiar los signals (útil en logout)
   *
   * @example
   * this.participantService.reset();
   */
  reset(): void {
    this.pendingParticipations.set([]);
    this.myCreatedTrips.set([]);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
  }
}
