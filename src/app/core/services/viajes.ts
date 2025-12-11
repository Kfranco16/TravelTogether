import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, Observable, forkJoin } from 'rxjs';
import { catchError, of, switchMap } from 'rxjs';
import { Trip } from '../../interfaces/trip';
import { environment } from '../../../environment/environment';
import { HttpParams } from '@angular/common/http';
export interface TripApiResponse {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  results: Trip[];
}

export interface ImageResponse {
  id: number;
  trip_id: number;
  user_id: number;
  image_url: string;
  description: string;
  main_img: string;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class TripService {
  private http = inject(HttpClient);

  tripsSignal = signal<Trip[]>([]);

  loadingSignal = signal<boolean>(false);

  errorSignal = signal<string | null>(null);

  private tripsCacheSignal = signal<Trip[] | null>(null);

  getTrips(token: string): Observable<TripApiResponse> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<TripApiResponse>(`${environment.apiUrl}/trips`, { headers });
  }

  async getTripById(id: number): Promise<Trip> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const url = `${environment.apiUrl}/trips/${id}`;
    return firstValueFrom(this.http.get<Trip>(url, { headers }));
  }

  async createTrip(tripData: any): Promise<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const url = `${environment.apiUrl}/trips/`;
    return await firstValueFrom(this.http.post<any>(url, tripData, { headers }));
  }
  getAllTrips(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/trips/`);
  }

  updateTrip(id: number, tripData: any): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const url = `${environment.apiUrl}/trips/${id}`;
    return this.http.put<any>(url, tripData, { headers });
  }

  deleteTripById(id: number, token?: string) {
    const auth = token || localStorage.getItem('authToken') || '';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${auth}`,
    });

    return this.http.delete(`${environment.apiUrl}/trips/${id}`, { headers });
  }

  getImagesByTripId(tripId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/images/trips/${tripId}`);
  }

  getParticipantsByTripId(tripId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/participations/trip/${tripId}`);
  }

  addFavorite(tripId: number, token: string): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/favorites`,
      { trip_id: tripId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  removeFavoriteById(favoriteId: number, token: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/favorites/${favoriteId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  isFavoriteByTrip(tripId: number, token: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/favorites/trip/${tripId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  getFavoritesByUser(userId: number, token: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/favorites/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async uploadImage(
    file: File,
    description: string,
    tripId: number | null,
    userId: number,
    mainImg: boolean
  ): Promise<any> {
    const url = `${environment.apiUrl}/images/upload`;
    const formData = new FormData();

    formData.append('image', file);

    if (tripId !== null) {
      formData.append('trip_id', tripId.toString());
    }
    formData.append('user_id', userId.toString());
    formData.append('description', description);
    formData.append('main_img', mainImg ? '1' : '0');

    const token = localStorage.getItem('authToken');
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers,
    });

    if (!response.ok) throw new Error('Error al subir imagen: ' + response.statusText);
    return await response.json();
  }

  async uploadUserImage(file: File, userId: number): Promise<any> {
    return this.uploadImage(file, 'avatar', null, userId, true);
  }

  getTripsByCreator(userId: number): Observable<any> {
    const token = localStorage.getItem('authToken') || '';
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    const params = new HttpParams()
      .set('creator_id', String(userId))
      .set('per_page', '50')
      .set('page', '1');

    return this.http.get<any>(`${environment.apiUrl}/trips`, {
      headers,
      params,
    });
  }

  getMisReservas(userId: number): Observable<any[]> {
    const token = localStorage.getItem('tt_token') || '';
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    const params = new HttpParams().set('user_id', String(userId));
    return this.http.get<any[]>('http://localhost:3000/api/bookings', { headers, params });
  }

  getFavoritos(userId: number): Observable<any[]> {
    const token = localStorage.getItem('tt_token') || '';
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    const params = new HttpParams().set('user_id', String(userId));
    return this.http.get<any[]>(environment.apiUrl + '/favorites', { headers, params });
  }

  loadAllTrips(token?: string, forceRefresh: boolean = false): Observable<Trip[]> {
    const cachedTrips = this.tripsCacheSignal();
    if (cachedTrips && !forceRefresh) {
      this.tripsSignal.set(cachedTrips);
      this.loadingSignal.set(false);
      return of(cachedTrips);
    }

    const authToken =
      token || localStorage.getItem('authToken') || localStorage.getItem('tt_token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${authToken}` });

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http
      .get<TripApiResponse>(`${environment.apiUrl}/trips`, {
        headers,
        params: new HttpParams().set('page', '1'),
      })
      .pipe(
        catchError((error) => {
          const errorMsg =
            'Error al cargar viajes: ' +
            (error?.error?.message || error.statusText || 'Error desconocido');
          this.errorSignal.set(errorMsg);
          this.loadingSignal.set(false);
          console.error(errorMsg);
          return of({ page: 1, per_page: 0, total: 0, total_pages: 0, results: [] });
        }),

        switchMap((firstPageResponse) => {
          if (firstPageResponse.total === 0 || firstPageResponse.total_pages === 0) {
            this.tripsSignal.set([]);
            this.tripsCacheSignal.set([]);
            this.loadingSignal.set(false);
            return of([]);
          }

          const allTrips = [...firstPageResponse.results];

          if (firstPageResponse.total_pages === 1) {
            this.tripsSignal.set(allTrips);
            this.tripsCacheSignal.set(allTrips);
            this.loadingSignal.set(false);
            return of(allTrips);
          }

          const paginasRestantes = Array.from(
            { length: firstPageResponse.total_pages - 1 },
            (_, i) => i + 2
          );

          const peticionesPaginas$ = paginasRestantes.map((numeroPagina) =>
            this.http
              .get<TripApiResponse>(`${environment.apiUrl}/trips`, {
                headers,
                params: new HttpParams().set('page', numeroPagina.toString()),
              })
              .pipe(
                catchError((error) => {
                  console.warn(`Error al cargar página ${numeroPagina}:`, error);
                  return of({
                    page: numeroPagina,
                    per_page: 0,
                    total: 0,
                    total_pages: 0,
                    results: [],
                  });
                })
              )
          );

          return forkJoin(peticionesPaginas$).pipe(
            switchMap((respuestasOtrasPaginas) => {
              respuestasOtrasPaginas.forEach((respuesta) => {
                allTrips.push(...respuesta.results);
              });

              this.tripsSignal.set(allTrips);
              this.tripsCacheSignal.set(allTrips);
              this.loadingSignal.set(false);

              return of(allTrips);
            }),
            catchError((error) => {
              const errorMsg = 'Error al consolidar viajes: ' + error?.message;
              this.errorSignal.set(errorMsg);
              this.loadingSignal.set(false);
              console.error(errorMsg);

              return of(allTrips);
            })
          );
        })
      );
  }

  getTripsSignal(): Observable<Trip[]> {
    return of(this.tripsSignal());
  }
}
