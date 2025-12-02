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
 * Example response:
 * {
 *   "message": "Solicitud para unirse al viaje creada con éxito. Esperando aprobación.",
 *   "data": {
 *     "id": 21,
 *     "status": "pending",
 *     "request_date": "2025-11-26T16:06:34.000Z",
 *     "response_date": null,
 *     "user_id": 30,
 *     "trip_id": 6
 *   }
 * }
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

/**
 * Una solicitud pendiente con información del participante y del viaje
 * Example response:
 * {
 *   "participation_id": 21,
 *   "status": "pending",
 *   "request_date": "2025-11-26T16:06:34.000Z",
 *   "response_date": "2025-11-29T19:37:14.000Z",
 *   "trip_id": 6,
 *   "trip_name": "Caza de la Aurora Boreal en el Ártico",
 *   "participant_user_id": 30,
 *   "participant_username": "lauragarcia",
 *   "participant_email": "lauragarcia@gmail.com",
 *   "trip_image_url": null,
 *   "participant_image_url": null,
 *   "participant_avg_score": "4.0000"
 * }
 */
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
   * Llamada al endpoint: PATCH {apiUrl}/participations/{participationId}/approve
   * Header: Authorization: Bearer {token}
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
  approveParticipant(participationId: number): Observable<any> {
    const token = localStorage.getItem('tt_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http
      .patch<any>(
        `${environment.apiUrl}/participations/${participationId}/approve`,
        {},
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
   * Llamada al endpoint: PATCH {apiUrl}/participations/{participationId}/reject
   * Header: Authorization: Bearer {token}
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
  rejectParticipant(participationId: number): Observable<any> {
    const token = localStorage.getItem('tt_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http
      .patch<any>(
        `${environment.apiUrl}/participations/${participationId}/reject`,
        {},
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
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
  }
}
