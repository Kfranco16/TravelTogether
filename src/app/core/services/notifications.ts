import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface NotificationDto {
  id: number;
  title: string;
  message: string;
  type: 'trip' | 'message' | 'favorites' | 'group';
  is_read: 0 | 1;
  created_at: string;
  sender_id: number;
  receiver_id: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private baseUrl = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  create(
    notification: {
      title: string;
      message: string;
      type: string;
      sender_id: number;
      receiver_id: number;
    },
    token: string
  ): Observable<NotificationDto> {
    const headers = { Authorization: `Bearer ${token}` };
    const body = { ...notification, is_read: 0 };
    return this.http.post<NotificationDto>(this.baseUrl, body, { headers });
  }

  getAll(token: string): Observable<NotificationDto[]> {
    const headers = { Authorization: `Bearer ${token}` };
    return this.http
      .get<any>(this.baseUrl, { headers })
      .pipe(map((res) => (res.results?.results ?? []) as NotificationDto[]));
  }

  delete(id: number, token: string): Observable<void> {
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { headers });
  }
}
