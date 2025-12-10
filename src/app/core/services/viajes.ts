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

  // ==================== SIGNALS PARA MANEJO REACTIVO ====================
  // Signal que almacena todos los viajes cargados (incluyendo todas las páginas)
  tripsSignal = signal<Trip[]>([]);

  // Signal que indica si hay carga en progreso
  loadingSignal = signal<boolean>(false);

  // Signal que almacena mensajes de error
  errorSignal = signal<string | null>(null);

  // Signal privado para cachear los viajes y evitar peticiones repetidas
  private tripsCacheSignal = signal<Trip[] | null>(null);

  //Obtener lista de viajes general
  getTrips(token: string): Observable<TripApiResponse> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<TripApiResponse>(`${environment.apiUrl}/trips`, { headers });
  }

  //Obtener viaje por ID
  async getTripById(id: number): Promise<Trip> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const url = `${environment.apiUrl}/trips/${id}`;
    return firstValueFrom(this.http.get<Trip>(url, { headers }));
  }

  //Crear viaje
  async createTrip(tripData: any): Promise<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const url = `${environment.apiUrl}/trips/`;
    return await firstValueFrom(this.http.post<any>(url, tripData, { headers }));
  }
  getAllTrips(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/trips/`);
  }

  //Actualizar viaje
  updateTrip(id: number, tripData: any): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const url = `${environment.apiUrl}/trips/${id}`;
    return this.http.put<any>(url, tripData, { headers });
  }

  // Eliminar viaje
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

  //Mis reservas
  getMisReservas(userId: number): Observable<any[]> {
    const token = localStorage.getItem('tt_token') || '';
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    const params = new HttpParams().set('user_id', String(userId));
    return this.http.get<any[]>('http://localhost:3000/api/bookings', { headers, params });
  }

  //  Favoritos
  getFavoritos(userId: number): Observable<any[]> {
    const token = localStorage.getItem('tt_token') || '';
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    const params = new HttpParams().set('user_id', String(userId));
    return this.http.get<any[]>(environment.apiUrl + '/favorites', { headers, params });
  }

  // ==================== NUEVO MÉTODO: CARGAR TODOS LOS VIAJES CON SIGNALS ====================
  /**
   * Carga TODOS los viajes disponibles en la API, resolviendo la paginación automáticamente
   * Utiliza Signals para reactividad moderna en Angular 16+
   * Implementa caché para evitar peticiones repetidas
   *
   * @param token - Token de autenticación (opcional, se obtiene de localStorage si no se proporciona)
   * @param forceRefresh - Si es true, ignora el caché y fuerza nueva carga
   * @returns Observable<Trip[]> con todos los viajes consolidados
   *
   * FLUJO DE EJECUCIÓN:
   * 1. Verifica si hay datos en caché y forceRefresh es false
   * 2. Si hay caché válido, retorna los datos inmediatamente
   * 3. Si no, obtiene la primera página para saber el total de páginas
   * 4. Crea peticiones paralelas para todas las páginas restantes
   * 5. Consolida todos los resultados en un único array
   * 6. Almacena en caché y actualiza los signals
   */
  loadAllTrips(token?: string, forceRefresh: boolean = false): Observable<Trip[]> {
    // ========== PASO 1: VERIFICAR CACHÉ ==========
    const cachedTrips = this.tripsCacheSignal();
    if (cachedTrips && !forceRefresh) {
      // Retornar del caché de forma inmediata
      this.tripsSignal.set(cachedTrips);
      this.loadingSignal.set(false);
      return of(cachedTrips);
    }

    // ========== PASO 2: OBTENER TOKEN ==========
    const authToken =
      token || localStorage.getItem('authToken') || localStorage.getItem('tt_token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${authToken}` });

    // ========== PASO 3: ACTIVAR ESTADO DE CARGA ==========
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    // ========== PASO 4: OBTENER PRIMERA PÁGINA PARA CONOCER EL TOTAL ==========
    return this.http
      .get<TripApiResponse>(`${environment.apiUrl}/trips`, {
        headers,
        params: new HttpParams().set('page', '1'),
      })
      .pipe(
        // En caso de error en la primera página
        catchError((error) => {
          const errorMsg =
            'Error al cargar viajes: ' +
            (error?.error?.message || error.statusText || 'Error desconocido');
          this.errorSignal.set(errorMsg);
          this.loadingSignal.set(false);
          console.error(errorMsg);
          return of({ page: 1, per_page: 0, total: 0, total_pages: 0, results: [] });
        }),
        // Procesar la primera página
        switchMap((firstPageResponse) => {
          // Si no hay resultados
          if (firstPageResponse.total === 0 || firstPageResponse.total_pages === 0) {
            this.tripsSignal.set([]);
            this.tripsCacheSignal.set([]);
            this.loadingSignal.set(false);
            return of([]);
          }

          // Recolectar los viajes de la primera página
          const allTrips = [...firstPageResponse.results];

          // Si solo hay una página, retornar inmediatamente
          if (firstPageResponse.total_pages === 1) {
            this.tripsSignal.set(allTrips);
            this.tripsCacheSignal.set(allTrips);
            this.loadingSignal.set(false);
            return of(allTrips);
          }

          // ========== PASO 5: CREAR PETICIONES PARALELAS PARA PÁGINAS RESTANTES ==========
          // Calcular páginas restantes (desde página 2 hasta la última)
          const paginasRestantes = Array.from(
            { length: firstPageResponse.total_pages - 1 },
            (_, i) => i + 2
          );

          // Crear array de observables para cada página
          const peticionesPaginas$ = paginasRestantes.map((numeroPagina) =>
            this.http
              .get<TripApiResponse>(`${environment.apiUrl}/trips`, {
                headers,
                params: new HttpParams().set('page', numeroPagina.toString()),
              })
              .pipe(
                // Si una página falla, retornar array vacío para esa página
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

          // ========== PASO 6: EJECUTAR TODAS LAS PETICIONES EN PARALELO ==========
          // forkJoin espera a que TODAS las peticiones terminen, maximizando rendimiento
          return forkJoin(peticionesPaginas$).pipe(
            // Procesar resultados cuando todas las peticiones terminen
            switchMap((respuestasOtrasPaginas) => {
              // Consolidar todos los viajes de todas las páginas
              respuestasOtrasPaginas.forEach((respuesta) => {
                allTrips.push(...respuesta.results);
              });

              // ========== PASO 7: ACTUALIZAR SIGNALS Y CACHÉ ==========
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
              // Retornar lo que se pudo cargar de la primera página
              return of(allTrips);
            })
          );
        })
      );
  }

  /**
   * Método auxiliar para obtener los viajes desde el signal (útil en templates con async pipeline)
   * @returns Observable<Trip[]> que emite cuando los viajes están listos
   */
  getTripsSignal(): Observable<Trip[]> {
    return of(this.tripsSignal());
  }
}
