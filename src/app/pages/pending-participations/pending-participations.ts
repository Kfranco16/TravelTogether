import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ParticipantService,
  PendingParticipationInfo,
  MyCreatedTrip,
  MyCreatedTripsResponse,
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
   * Pestaña activa: 'pending' o 'accepted'
   * Controla cuál sección se muestra en el HTML
   */
  activeTab: 'pending' | 'accepted' = 'pending';

  // ========================================================================
  // CICLO DE VIDA
  // ========================================================================

  /**
   * ngOnInit - Se ejecuta cuando el componente se inicializa
   *
   * Responsabilidades:
   * 1. Cargar las solicitudes pendientes
   * 2. Cargar los viajes creados con participantes aceptados
   * 3. Mostrar datos en la UI
   */
  ngOnInit(): void {
    this.loadPendingParticipations();
    this.loadMyCreatedTrips();
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
   * Método para copiar JSON al portapapeles (útil para debugging)
   *
   * @param data - Datos a copiar
   */
  copyToClipboard(data: any): void {
    const jsonString = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      toast.success('JSON copiado al portapapeles');
    });
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
   * Cambiar pestaña activa
   *
   * @param tab - Nombre de la pestaña: 'pending' o 'accepted'
   */
  switchTab(tab: 'pending' | 'accepted'): void {
    this.activeTab = tab;
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
}
