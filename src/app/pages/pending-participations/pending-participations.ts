import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ParticipantService,
  PendingParticipationInfo,
  MyCreatedTrip,
  MyCreatedTripsResponse,
  UserParticipation,
  TripParticipation,
} from '../../core/services/participant.service';
import { toast } from 'ngx-sonner';
import { firstValueFrom } from 'rxjs';
/**
 * ============================================================================
 * PENDING PARTICIPATIONS COMPONENT (TEMPORAL - PARA DEBUGGING)
 * ============================================================================
 * Componente temporal para visualizar todas las solicitudes pendientes
 * de participación en los viajes creados por el usuario actual.
 *
 * IMPORTANTE: Este componente es temporal para validación de la API.
 * Una vez validado, será reemplazado por un componente mejorado en el dashboard.
 *
 * Funcionalidades:
 * - Cargar y mostrar solicitudes pendientes
 * - Mostrar información completa del participante
 * - Mostrar información del viaje
 * - Mostrar respuesta del API en formato JSON para debugging
 * - Aprobar/Rechazar participantes (próxima fase)
 * ============================================================================
 */

@Component({
  selector: 'app-pending-participations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pending-participations.html',
  styleUrl: './pending-participations.css',
})
export class PendingParticipationsComponent implements OnInit {
  // ========================================================================
  // INYECCIONES DE DEPENDENCIAS
  // ========================================================================
  private participantService = inject(ParticipantService);

  // ========================================================================
  // PROPIEDADES DEL COMPONENTE
  // ========================================================================

  /**
   * Array con todas las solicitudes pendientes
   * Se obtiene del servicio y se actualiza reactivamente
   */
  pendingParticipations: PendingParticipationInfo[] = [];

  /**
   * Array con todos los viajes creados y sus participantes aceptados
   * Se obtiene del servicio y se actualiza reactivamente
   */
  myCreatedTrips: MyCreatedTrip[] = [];

  /**
   * Array con todas las participaciones del usuario (viajes creados + viajes unidos)
   * Se obtiene del servicio y se usa para mostrar "Mis Viajes"
   */
  userParticipations: UserParticipation[] = [];

  /**
   * ID del usuario logeado obtenido de localStorage
   * Se usa para filtrar viajes creados (creator_id === userId)
   */
  userId: number | null = null;

  /**
   * Variable para rastrear si está cargando datos
   * Se usa para mostrar spinner/loader
   */
  isLoading: boolean = false;

  /**
   * Variable para almacenar mensajes de error
   * Se muestra al usuario si algo falla
   */
  errorMessage: string | null = null;

  /**
   * Mensaje de éxito del servidor
   * Se muestra después de cargar las solicitudes
   */
  successMessage: string | null = null;

  /**
   * Variable para debugging: almacena la respuesta completa del API
   * Se muestra en JSON para validar que el endpoint funciona correctamente
   */
  debugResponseData: any = null;

  /**
   * Pestaña activa: 'pending', 'accepted' o 'myTrips'
   * Controla cuál sección se muestra en el HTML
   */
  activeTab: 'pending' | 'accepted' | 'myTrips' = 'pending';

  /**
   * Map que almacena las participaciones cargadas para cada viaje
   * Clave: trip_id, Valor: array de participaciones de ese viaje
   * Se usa para mostrar participantes con su participation_id para eliminar
   */
  tripParticipationsMap = new Map<number, TripParticipation[]>();

  /**
   * Signal que controla la visibilidad del toast de confirmación
   * Se usa para mostrar/ocultar el modal de confirmación de borrado
   */
  mostrarToastConfirmacion = signal<boolean>(false);

  /**
   * Signal que almacena el mensaje del toast de confirmación
   */
  mensajeConfirmacion = signal<string>('');

  /**
   * Signal que almacena el ID de participación a eliminar
   * Se usa cuando el user confirma la eliminación
   */
  participationIdPendiente = signal<number | null>(null);

  /**
   * Signal que almacena el ID del viaje para la participación pendiente
   */
  tripIdPendiente = signal<number | null>(null);

  /**
   * Signal que controla si se está animando el toast de salida
   */
  ocultandoToastConfirmacion = signal<boolean>(false);

  // ========================================================================
  // CICLO DE VIDA
  // ========================================================================

  /**
   * ngOnInit - Se ejecuta cuando el componente se inicializa
   *
   * Responsabilidades:
   * 1. Obtener el userId del usuario logeado (localStorage)
   * 2. Cargar las solicitudes pendientes
   * 3. Cargar los viajes creados con participantes aceptados
   * 4. Cargar participaciones del usuario (viajes creados + unidos)
   */
  ngOnInit(): void {
    // Obtener userId del usuario logeado
    const usuarioStr = localStorage.getItem('usuario');
    if (usuarioStr) {
      const usuario = JSON.parse(usuarioStr);
      this.userId = usuario.id || null;
    }

    // Cargar datos
    this.loadPendingParticipations();
    this.loadMyCreatedTrips();
    this.loadMyParticipations();
  }

  // ========================================================================
  // MÉTODOS PÚBLICOS
  // ========================================================================

  /**
   * Cargar todas las solicitudes pendientes desde el servicio
   *
   * Flujo:
   * 1. Activar estado de carga
   * 2. Llamar al servicio ParticipantService.getPendingParticipations()
   * 3. Si es exitoso: guardar datos y mostrar mensaje
   * 4. Si falla: mostrar error al usuario
   * 5. Guardar respuesta completa para debugging
   */
  async loadPendingParticipations(): Promise<MyCreatedTripsResponse | void> {
    // 🔄 Activar estado de carga
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    try {
      // 📡 Llamar al servicio usando async/await
      const response = await firstValueFrom(this.participantService.getPendingParticipations());

      // Guardar el mensaje del servidor
      this.successMessage = response.message;
      this.pendingParticipations = response.data;
      this.debugResponseData = response;

      // 📊 Toast de éxito
      toast.success(`Se encontraron ${response.data.length} solicitudes pendientes`, {
        description: this.successMessage,
      });
    } catch (error: any) {
      // ❌ Manejo de error
      console.error('❌ Error al cargar solicitudes:', error);

      const errorMsg = error?.message || 'Error al obtener solicitudes pendientes';
      this.errorMessage = errorMsg;

      toast.error(errorMsg, {
        description: 'Por favor, intenta de nuevo más tarde',
      });
    } finally {
      // 🔄 Desactivar estado de carga (SIEMPRE)
      this.isLoading = false;
    }
  }
  /**
   * Método para recargar las solicitudes
   * Útil para refrescar datos después de aprobar/rechazar
   */
  refreshParticipations(): void {
    this.loadPendingParticipations();
  }

  /**
   * Obtener el color de badge según el estado
   */
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-warning text-dark';
      case 'accepted':
        return 'bg-success';
      case 'rejected':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  /**
   * Traducir estado al español
   */
  translateStatus(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'accepted':
        return 'Aceptado';
      case 'rejected':
        return 'Rechazado';
      default:
        return status;
    }
  }

  /**
   * Aprobar a un participante
   * Llamada al servicio para actualizar el estado de la participación a 'accepted'
   *
   * @param participationId - ID de la participación a aprobar
   */
  async approveParticipation(participationId: number): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.participantService.approveParticipant(participationId)
      );
      toast.success('Participante aprobado correctamente');
      // Recargar las solicitudes pendientes
      await this.loadPendingParticipations();
      // También actualizar los viajes creados para reflejar el nuevo participante aceptado
      await this.loadMyCreatedTrips();
    } catch (error: any) {
      const errorMsg = error?.message || 'Error al aprobar participante';
      console.error('❌ Error:', errorMsg);
      toast.error(errorMsg);
    }
  }

  /**
   * Rechazar a un participante
   * Llamada al servicio para actualizar el estado de la participación a 'rejected'
   *
   * @param participationId - ID de la participación a rechazar
   */
  async rejectParticipation(participationId: number): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.participantService.rejectParticipant(participationId)
      );
      toast.success('Participante rechazado correctamente');
      // Recargar las solicitudes pendientes
      await this.loadPendingParticipations();
    } catch (error: any) {
      const errorMsg = error?.message || 'Error al rechazar participante';
      console.error('❌ Error:', errorMsg);
      toast.error(errorMsg);
    }
  }

  /**
   * Cargar todos los viajes creados con sus participantes aceptados
   *
   * Flujo:
   * 1. Activar estado de carga
   * 2. Llamar al servicio ParticipantService.getMyCreatedTripsWithParticipants()
   * 3. Si es exitoso: guardar datos y mostrar mensaje
   * 4. Si falla: mostrar error al usuario
   * 5. Guardar respuesta completa para debugging
   */
  async loadMyCreatedTrips(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    try {
      const response = await firstValueFrom(
        this.participantService.getMyCreatedTripsWithParticipants()
      );

      this.successMessage = response.message;
      this.myCreatedTrips = response.data;
      this.debugResponseData = response;

      toast.success(`Se encontraron ${response.data.length} viaje(s) creado(s)`, {
        description: this.successMessage,
      });
    } catch (error: any) {
      console.error('❌ Error al cargar viajes:', error);

      const errorMsg = error?.message || 'Error al obtener viajes creados';
      this.errorMessage = errorMsg;

      toast.error(errorMsg, {
        description: 'Por favor, intenta de nuevo más tarde',
      });
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Cargar todas las participaciones del usuario (viajes creados + viajes unidos)
   *
   * Flujo:
   * 1. Activar estado de carga
   * 2. Llamar al servicio ParticipantService.getMyParticipations()
   * 3. Si es exitoso: guardar datos
   * 4. Si falla: mostrar error al usuario
   */
  async loadMyParticipations(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    try {
      const response = await firstValueFrom(this.participantService.getMyParticipations());

      this.successMessage = response.message;
      this.userParticipations = response.data;
      this.debugResponseData = response;

      toast.success(`Se encontraron ${response.data.length} viaje(s)`, {
        description: this.successMessage,
      });
    } catch (error: any) {
      console.error('❌ Error al cargar participaciones:', error);

      const errorMsg = error?.message || 'Error al obtener tus viajes';
      this.errorMessage = errorMsg;

      toast.error(errorMsg, {
        description: 'Por favor, intenta de nuevo más tarde',
      });
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Cambiar pestaña activa
   *
   * @param tab - Nombre de la pestaña: 'pending', 'accepted' o 'myTrips'
   */
  switchTab(tab: 'pending' | 'accepted' | 'myTrips'): void {
    this.activeTab = tab;

    // Cuando se abre la pestaña 'accepted', cargar participaciones de los viajes
    if (tab === 'accepted' && this.myCreatedTrips.length > 0) {
      this.loadAllTripParticipations();
    }
  }

  /**
   * Cargar las participaciones de todos los viajes creados
   * Se llama cuando se abre la pestaña 'accepted'
   * Una única petición GET por viaje para obtener participation_id
   */
  async loadAllTripParticipations(): Promise<void> {
    this.isLoading = true;

    try {
      // Cargar participaciones para cada viaje en paralelo
      const tripIds = this.myCreatedTrips.map((trip) => trip.trip_id);
      const requests = tripIds.map((tripId) =>
        firstValueFrom(this.participantService.getTripParticipations(tripId))
      );

      const responses = await Promise.all(requests);

      // Guardar en el Map local
      responses.forEach((response) => {
        if (response.data.length > 0) {
          const tripId = response.data[0].participation_id; // Obtener tripId de la respuesta
          console.log('viajes capturados', tripId);

          // Mapear usando el trip_id del array myCreatedTrips
          const trip = this.myCreatedTrips.find((t) => {
            // Buscar coincidencia por estructura de datos
            return response.data.some((p: any) => p.user_id !== this.userId);
          });

          if (trip) {
            this.tripParticipationsMap.set(trip.trip_id, response.data);
          }
        }
      });

      toast.success('Participantes cargados correctamente');
    } catch (error: any) {
      console.error('❌ Error al cargar participaciones:', error);
      const errorMsg = error?.message || 'Error al cargar participantes';
      this.errorMessage = errorMsg;
      toast.error(errorMsg);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Obtener las participaciones de un viaje específico
   * Busca en el Map local primero, si no está cargado usa caché del servicio
   *
   * @param tripId - ID del viaje
   * @returns Array de participaciones del viaje
   */
  getTripParticipations(tripId: number): TripParticipation[] {
    // Primero buscar en el Map local
    if (this.tripParticipationsMap.has(tripId)) {
      return this.tripParticipationsMap.get(tripId) || [];
    }

    // Si no, intentar obtener del caché del servicio
    const cached = this.participantService.getCachedTripParticipations(tripId);
    if (cached) {
      this.tripParticipationsMap.set(tripId, cached);
      return cached;
    }

    return [];
  }

  /**
   * Obtener el participation_id de un usuario específico en un viaje
   * Se usa para encontrar el participation_id necesario para eliminar
   *
   * @param tripId - ID del viaje
   * @param userId - ID del usuario (participante)
   * @returns participation_id o null si no se encuentra
   */
  getParticipationId(tripId: number, userId: number): number | null {
    const participations = this.getTripParticipations(tripId);
    const participation = participations.find((p) => p.user_id === userId);
    return participation ? participation.participation_id : null;
  }

  /**
   * Mostrar confirmación antes de eliminar participante
   * Usa un toast modal para pedir confirmación al user
   *
   * @param participationId - ID de la participación a eliminar
   * @param tripId - ID del viaje
   * @param participantName - Nombre del participante (para el mensaje)
   */
  mostrarConfirmacionEliminar(
    participationId: number,
    tripId: number,
    participantName: string
  ): void {
    this.participationIdPendiente.set(participationId);
    this.tripIdPendiente.set(tripId);
    this.mensajeConfirmacion.set(
      `¿Eliminar a ${participantName} de este viaje? Esta acción no se puede deshacer.`
    );
    this.ocultandoToastConfirmacion.set(false);
    this.mostrarToastConfirmacion.set(true);
  }

  /**
   * Confirmar y ejecutar la eliminación del participante
   * Se llama cuando el user hace click en "Confirmar" en el toast
   */
  confirmarEliminacion(): void {
    const participationId = this.participationIdPendiente();
    const tripId = this.tripIdPendiente();

    if (participationId && tripId) {
      this.ocultarToastConfirmacion();
      // Esperar a que se anule la animación antes de eliminar
      setTimeout(() => {
        this.deleteParticipant(participationId, tripId);
      }, 300);
    }
  }

  /**
   * Cancelar la eliminación
   * Oculta el toast de confirmación
   */
  cancelarEliminacion(): void {
    this.ocultarToastConfirmacion();
  }

  /**
   * Ocultar el toast de confirmación con animación de salida
   */
  ocultarToastConfirmacion(): void {
    this.ocultandoToastConfirmacion.set(true);

    setTimeout(() => {
      this.mostrarToastConfirmacion.set(false);
      this.ocultandoToastConfirmacion.set(false);
      this.participationIdPendiente.set(null);
      this.tripIdPendiente.set(null);
    }, 300);
  }

  /**
   * Eliminar un participante de un viaje (optimistic update)
   * 1. Actualiza la UI inmediatamente (optimistic update)
   * 2. Hace la petición DELETE
   * 3. Si falla, revierte los cambios
   *
   * @param participationId - ID de la participación a eliminar
   * @param tripId - ID del viaje (para actualizar el Map)
   */
  async deleteParticipant(participationId: number, tripId: number): Promise<void> {
    // Obtener la participación antes de eliminar (para revertir si falla)
    const participations = this.tripParticipationsMap.get(tripId) || [];
    const deletedParticipation = participations.find((p) => p.participation_id === participationId);

    if (!deletedParticipation) {
      toast.error('No se encontró el participante');
      return;
    }

    try {
      // Optimistic update: eliminar de la UI inmediatamente
      const updatedParticipations = participations.filter(
        (p) => p.participation_id !== participationId
      );
      this.tripParticipationsMap.set(tripId, updatedParticipations);

      // Hacer la petición DELETE
      const response = await firstValueFrom(
        this.participantService.deleteParticipant(participationId)
      );

      // Actualizar también en myCreatedTrips (reducir current_participants)
      const trip = this.myCreatedTrips.find((t) => t.trip_id === tripId);
      if (trip) {
        trip.current_participants = Math.max(0, trip.current_participants - 1);
      }

      toast.success('Participante eliminado correctamente', {
        description: response.message,
      });

      console.log('✅ Participante eliminado:', response.data);
    } catch (error: any) {
      // Revertir cambios en caso de error
      this.tripParticipationsMap.set(tripId, participations);

      console.error('❌ Error al eliminar participante:', error);
      const errorMsg = error?.message || 'Error al eliminar participante';
      this.errorMessage = errorMsg;

      toast.error(errorMsg, {
        description: 'Por favor, intenta de nuevo más tarde',
      });
    }
  }

  /**
   * Obtener los participantes aceptados de un viaje específico
   *
   * Filtra solo los participantes con status 'accepted' del array all_related_participants
   *
   * @param trip - Viaje del cual obtener participantes aceptados
   * @returns Array de participantes con status 'accepted'
   */
  getAcceptedParticipants(trip: MyCreatedTrip) {
    return trip.all_related_participants.filter((p) => p.status === 'accepted');
  }

  /**
   * Verificar si una participación fue creada por el usuario logeado
   *
   * @param participation - Participación a verificar
   * @returns true si el creator_id es igual al userId logeado
   */
  isMyTrip(participation: UserParticipation): boolean {
    return participation.creator_id === this.userId;
  }

  /**
   * Obtener el badge de tipo para una participación
   * Indica si el viaje fue creado por el usuario o si se unió
   *
   * @param participation - Participación a verificar
   * @returns Objeto con color y texto del badge
   */
  getTripTypeBadge(participation: UserParticipation) {
    if (this.isMyTrip(participation)) {
      return {
        color: 'bg-success',
        icon: 'bi-star',
        text: 'Creado por ti',
      };
    } else {
      return {
        color: 'bg-info',
        icon: 'bi-person-check',
        text: 'Te uniste',
      };
    }
  }
}
