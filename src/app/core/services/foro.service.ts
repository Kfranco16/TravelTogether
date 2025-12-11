import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, of, delay } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environment/environment';

// ============================================================================
// INTERFACES / TIPOS
// ============================================================================

/**
 * Información del usuario (sender o receiver)
 */
export interface ForumUser {
  id: number;
  username: string;
  email: string;
}

/**
 * Información del viaje relacionado con el mensaje
 */
export interface ForumTrip {
  id: number;
  title: string;
  description: string;
  origin: string;
  start_date: string;
  end_date: string;
}

/**
 * Información del grupo (por ahora ignorado, pero presente en la respuesta)
 */
export interface ForumGroup {
  id: number;
  title: string;
}

/**
 * Mensaje individual del foro - Estructura completa
 */
export interface ForumMessage {
  id: number;
  message: string;
  created_at: string;
  sender_id: number;
  receiver_id: number;
  trip_id: number;
  group_id: number;
  // Datos relacionados (embebidos en la respuesta)
  sender?: ForumUser;
  receiver?: ForumUser;
  trip?: ForumTrip;
  group?: ForumGroup;
}

/**
 * Request body para crear un nuevo mensaje
 */
export interface CreateMessageRequest {
  message: string;
  sender_id: number;
  receiver_id: number;
  trip_id: number;
  group_id: number;
}

/**
 * Respuesta del API al crear un mensaje
 */
export interface CreateMessageResponse {
  message: string;
  newMessage: ForumMessage[];
}

/**
 * Respuesta paginada del API al obtener mensajes
 * Estructura anidada según el ejemplo proporcionado
 */
export interface GetMessagesResponse {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  results: {
    total: number;
    results: ForumMessage[];
    page: number;
    per_page: number;
    total_pages: number;
  };
}

/**
 * Interfaz para los detalles del viaje (heredada, compatibilidad)
 */
export interface TripDetails {
  id: string;
  title: string;
}

// ============================================================================
// INJECTABLE SERVICE
// ============================================================================

@Injectable({
  providedIn: 'root',
})
export class ForoService {
  // ========================================================================
  // INYECCIONES DE DEPENDENCIAS
  // ========================================================================
  private http = inject(HttpClient);

  // ========================================================================
  // MÉTODOS PÚBLICOS - MENSAJES DEL FORO
  // ========================================================================

  /**
   * Envía un nuevo mensaje al foro de un viaje
   *
   * Llamada al endpoint: POST {apiUrl}/messages
   * Headers:
   *   - Authorization: Bearer {token}
   *   - Content-Type: application/json
   *
   * Body:
   * {
   *   "message": string,
   *   "sender_id": number (usuario que envía),
   *   "receiver_id": number (creador del foro),
   *   "trip_id": number,
   *   "group_id": number (por ahora todos usan mismo grupo)
   * }
   *
   * @param senderId - ID del usuario que envía el mensaje (desde ForumAccessContext)
   * @param receiverId - ID del creador del viaje (desde ForumAccessContext)
   * @param tripId - ID del viaje
   * @param messageText - Contenido del mensaje
   * @param groupId - ID del grupo (por defecto 1)
   * @returns Observable con la respuesta del API
   *
   * @example
   * this.foroService.createMessage(
   *   3,  // senderId (current user)
   *   1,  // receiverId (trip creator)
   *   4,  // tripId
   *   "Este es mi mensaje",
   *   1   // groupId default
   * ).subscribe({
   *   next: (response) => {
   *     console.log('Mensaje enviado:', response.newMessage);
   *   },
   *   error: (error) => console.error('Error:', error)
   * });
   */
  createMessage(
    senderId: number,
    receiverId: number,
    tripId: number,
    messageText: string,
    groupId: number = 1
  ): Observable<CreateMessageResponse> {
    const token = localStorage.getItem('tt_token');

    if (!token) {
      return throwError(() => ({
        message: 'No hay token de autenticación',
      }));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    const body: CreateMessageRequest = {
      message: messageText,
      sender_id: senderId,
      receiver_id: receiverId,
      trip_id: tripId,
      group_id: groupId,
    };

    return this.http
      .post<CreateMessageResponse>(`${environment.apiUrl}/messages`, body, {
        headers,
      })
      .pipe(
        tap((response) => {
          // Success logged implicitly
        }),
        catchError((error) => {
          const errorMsg = error?.error?.message || 'Error al enviar el mensaje al foro';
          return throwError(() => ({
            message: errorMsg,
            error,
          }));
        })
      );
  }

  /**
   * Obtiene todos los mensajes de un viaje específico
   *
   * Llamada al endpoint: GET {apiUrl}/messages/where?page={page}&per_page={per_page}&where=trip_id:{tripId}
   * Headers:
   *   - Authorization: Bearer {token}
   *
   * Parámetros de query:
   *   - page: Número de página (default: 1)
   *   - per_page: Mensajes por página (default: 10)
   *   - where: Filtro de búsqueda personalizado (ej: trip_id:4)
   *
   * @param tripId - ID del viaje del cual obtener mensajes
   * @param page - Número de página (default: 1)
   * @param perPage - Mensajes por página (default: 10)
   * @returns Observable con la respuesta paginada del API
   *
   * @example
   * this.foroService.getMessages(4, 1, 10).subscribe({
   *   next: (response) => {
   *     console.log('Total mensajes:', response.results.total);
   *     console.log('Mensajes:', response.results.results);
   *   },
   *   error: (error) => console.error('Error:', error)
   * });
   */
  getMessages(
    tripId: number,
    page: number = 1,
    perPage: number = 10
  ): Observable<GetMessagesResponse> {
    const token = localStorage.getItem('tt_token');

    if (!token) {
      return throwError(() => ({
        message: 'No hay token de autenticación',
      }));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    const params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString())
      .set('where', `trip_id:${tripId}`);

    return this.http
      .get<GetMessagesResponse>(`${environment.apiUrl}/messages/where`, {
        headers,
        params,
      })
      .pipe(
        tap((response) => {
          // Success logged implicitly
        }),
        catchError((error) => {
          const errorMsg = error?.error?.message || 'Error al obtener mensajes del foro';
          return throwError(() => ({
            message: errorMsg,
            error,
          }));
        })
      );
  }

  /**
   * Elimina un mensaje específico del foro
   *
   * Llamada al endpoint: DELETE {apiUrl}/messages/{messageId}
   * Headers:
   *   - Authorization: Bearer {token}
   *   - Content-Type: application/json
   *
   * Respuesta:
   * {
   *   "message": [{ ... datos del mensaje eliminado ... }]
   * }
   *
   * IMPORTANTE:
   * - Solo el creador del mensaje o administrador pueden eliminar
   * - Esta validación se hace en el backend
   * - El frontend debe validar permisos antes de mostrar el botón
   *
   * @param messageId - ID del mensaje a eliminar
   * @returns Observable con la respuesta del API (mensaje eliminado)
   *
   * @example
   * this.foroService.deleteMessage(10).subscribe({
   *   next: (response) => {
   *     console.log('Mensaje eliminado:', response.message);
   *   },
   *   error: (error) => console.error('Error:', error)
   * });
   */
  deleteMessage(messageId: number): Observable<{ message: ForumMessage[] }> {
    const token = localStorage.getItem('tt_token');

    if (!token) {
      return throwError(() => ({
        message: 'No hay token de autenticación',
      }));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    return this.http
      .delete<{ message: ForumMessage[] }>(`${environment.apiUrl}/messages/${messageId}`, {
        headers,
      })
      .pipe(
        tap((response) => {
          // Success logged implicitly
        }),
        catchError((error) => {
          const errorMsg = error?.error?.message || 'Error al eliminar el mensaje';
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
   * Método auxiliar para construir la cláusula WHERE personalizada
   * Útil para filtros más complejos en el futuro
   *
   * @param tripId - ID del viaje a filtrar
   * @returns String de filtro para el parámetro where
   *
   * @example
   * const whereClause = this.buildWhereClause(4);
   * // Resultado: "trip_id:4"
   */
  private buildWhereClause(tripId: number): string {
    return `trip_id:${tripId}`;
  }
}
