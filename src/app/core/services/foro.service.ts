import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, of, delay } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environment/environment';

export interface ForumUser {
  id: number;
  username: string;
  email: string;
}

export interface ForumTrip {
  id: number;
  title: string;
  description: string;
  origin: string;
  start_date: string;
  end_date: string;
}

export interface ForumGroup {
  id: number;
  title: string;
}

export interface ForumMessage {
  id: number;
  message: string;
  created_at: string;
  sender_id: number;
  receiver_id: number;
  trip_id: number;
  group_id: number;

  sender?: ForumUser;
  receiver?: ForumUser;
  trip?: ForumTrip;
  group?: ForumGroup;
}

export interface CreateMessageRequest {
  message: string;
  sender_id: number;
  receiver_id: number;
  trip_id: number;
  group_id: number;
}

export interface CreateMessageResponse {
  message: string;
  newMessage: ForumMessage[];
}

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

export interface TripDetails {
  id: string;
  title: string;
}

@Injectable({
  providedIn: 'root',
})
export class ForoService {
  private http = inject(HttpClient);

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
        tap((response) => {}),
        catchError((error) => {
          const errorMsg = error?.error?.message || 'Error al enviar el mensaje al foro';
          return throwError(() => ({
            message: errorMsg,
            error,
          }));
        })
      );
  }

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
        tap((response) => {}),
        catchError((error) => {
          const errorMsg = error?.error?.message || 'Error al obtener mensajes del foro';
          return throwError(() => ({
            message: errorMsg,
            error,
          }));
        })
      );
  }

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
        tap((response) => {}),
        catchError((error) => {
          const errorMsg = error?.error?.message || 'Error al eliminar el mensaje';
          return throwError(() => ({
            message: errorMsg,
            error,
          }));
        })
      );
  }

  private buildWhereClause(tripId: number): string {
    return `trip_id:${tripId}`;
  }
}
