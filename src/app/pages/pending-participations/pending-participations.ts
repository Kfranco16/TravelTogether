import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ParticipantService,
  PendingParticipationInfo,
} from '../../core/services/participant.service';
import { toast } from 'ngx-sonner';

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

  // ========================================================================
  // CICLO DE VIDA
  // ========================================================================

  /**
   * ngOnInit - Se ejecuta cuando el componente se inicializa
   *
   * Responsabilidades:
   * 1. Cargar las solicitudes pendientes
   * 2. Mostrar datos en la UI
   */
  ngOnInit(): void {
    this.loadPendingParticipations();
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
  loadPendingParticipations(): void {
    // 🔄 Activar estado de carga
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    // 📡 Llamar al servicio para obtener solicitudes pendientes
    this.participantService.getPendingParticipations().subscribe({
      // ✅ Respuesta exitosa
      next: (response) => {
        console.log('📥 Respuesta del API:', response);

        // Guardar el mensaje del servidor
        this.successMessage = response.message;

        // Guardar las solicitudes
        this.pendingParticipations = response.data;

        // 💾 Guardar la respuesta completa para debugging (ver JSON en la UI)
        this.debugResponseData = response;

        // 📊 Mostrar cantidad de solicitudes
        toast.success(`Se encontraron ${response.data.length} solicitudes pendientes`, {
          description: this.successMessage,
        });

        console.log(`✅ ${response.data.length} solicitudes cargadas exitosamente`);
      },

      // ❌ Error
      error: (error) => {
        console.error('❌ Error al cargar solicitudes:', error);

        // Mostrar mensaje de error al usuario
        const errorMsg = error?.message || 'Error al obtener solicitudes pendientes';
        this.errorMessage = errorMsg;

        // Notificar al usuario
        toast.error(errorMsg, {
          description: 'Por favor, intenta de nuevo más tarde',
        });
      },

      // 🏁 Completado (siempre se ejecuta)
      complete: () => {
        // 🔄 Desactivar estado de carga
        this.isLoading = false;
      },
    });
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
}
