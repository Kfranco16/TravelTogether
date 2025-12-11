import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ForoService, ForumMessage, GetMessagesResponse } from '../../core/services/foro.service';
import { ForumAccessContext } from '../../core/interfaces/forum-access-context';
import { ParticipantService, TripParticipation } from '../../core/services/participant.service';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-foro-viaje',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './foro-viaje.html',
  styleUrls: ['./foro-viaje.css'],
})
export class ForoViaje implements OnInit {
  // ========================================================================
  // INYECCIONES DE DEPENDENCIAS
  // ========================================================================
  private foroService = inject(ForoService);
  private participantService = inject(ParticipantService);
  private router = inject(Router);

  // ========================================================================
  // SIGNALS - ESTADO REACTIVO
  // ========================================================================

  /**
   * Contexto de acceso al foro - contiene permisos y información del usuario
   * Viene de sessionStorage, establecido por accederAlForo()
   */
  forumContext = signal<ForumAccessContext | null>(null);

  /**
   * Indica si el acceso fue denegado
   * Se usa para mostrar un mensaje de error y redirigir
   */
  accessDenied = signal<boolean>(false);

  /**
   * Título del viaje, cargado desde el contexto o servicio
   */
  tripTitle = signal<string>('');

  /**
   * Lista de mensajes del foro cargados desde el API
   */
  messages = signal<ForumMessage[]>([]);

  /**
   * Indica si los datos del foro se están cargando
   */
  isLoading = signal<boolean>(true);

  /**
   * Indica si se está enviando un nuevo mensaje
   */
  isSendingMessage = signal<boolean>(false);

  /**
   * Nuevo mensaje que el usuario está escribiendo
   */
  newMessage = signal<string>('');

  /**
   * Mensaje de error si algo falla al cargar datos
   */
  errorMessage = signal<string | null>(null);

  /**
   * Información de paginación de mensajes
   */
  paginationInfo = signal<{
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  }>({
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
  });

  /**
   * Mapa de participantes del viaje para enriquecer mensajes
   * Clave: user_id, Valor: {username, email}
   */
  private participantsMap = signal<Map<number, { username: string; email: string }>>(new Map());

  /**
   * Signal que controla la visibilidad del toast de confirmación de eliminación
   * Se usa para mostrar/ocultar el modal de confirmación de borrado de mensaje
   */
  mostrarToastConfirmacion = signal<boolean>(false);

  /**
   * Signal que almacena el mensaje del toast de confirmación
   */
  mensajeConfirmacion = signal<string>('');

  /**
   * Signal que almacena el mensaje a eliminar (pendiente de confirmación)
   */
  mensajePendiente = signal<ForumMessage | null>(null);

  /**
   * Signal que controla si se está animando el toast de salida
   */
  ocultandoToastConfirmacion = signal<boolean>(false);

  // ========================================================================
  // CICLO DE VIDA
  // ========================================================================

  /**
   * ngOnInit - Se ejecuta al inicializar el componente
   *
   * Responsabilidades:
   * 1. Recuperar el contexto de acceso de sessionStorage
   * 2. Validar que el usuario tiene permiso para acceder
   * 3. Si tiene acceso, cargar los mensajes del foro
   * 4. Si NO tiene acceso, mostrar error y redirigir
   */
  ngOnInit(): void {
    // =====================================================================
    // PASO 1: Recuperar el contexto de sessionStorage
    // =====================================================================
    const contextStr = sessionStorage.getItem('forumContext');

    if (!contextStr) {
      this.accessDenied.set(true);
      this.errorMessage.set('Error: No se pudo validar tu acceso al foro');
      this.isLoading.set(false);
      toast.error('Acceso denegado al foro');

      // Redirigir a dashboard después de 2 segundos
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 2000);
      return;
    }

    try {
      const context = JSON.parse(contextStr) as ForumAccessContext;

      // Validar que el contexto sea válido
      if (!context.tripId || !context.userId) {
        throw new Error('Contexto incompleto');
      }

      // Almacenar el contexto
      this.forumContext.set(context);

      // Usar el tripTitle del contexto
      this.tripTitle.set(context.tripTitle);

      // Cargar participantes del viaje
      this.loadTripParticipants(context.tripId);

      // Cargar mensajes del foro
      this.loadMessages(context.tripId);
    } catch (error) {
      this.accessDenied.set(true);
      this.errorMessage.set('Error: Contexto de acceso inválido');
      this.isLoading.set(false);
      toast.error('Error al validar acceso');

      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 2000);
    }
  }

  // ========================================================================
  // MÉTODOS PÚBLICOS
  // ========================================================================

  /**
   * Envía un nuevo mensaje al foro
   *
   * Validaciones:
   * - El usuario tiene permiso de escritura (canWriteMessages)
   * - El mensaje no está vacío
   * - Valida que haya contexto de acceso válido
   *
   * Flujo:
   * 1. Valida permisos
   * 2. Valida contenido
   * 3. Optimistic update: Agrega mensaje a lista local
   * 4. Llamada al API
   * 5. Si falla, remueve mensaje local
   */
  sendMessage(): void {
    const context = this.forumContext();

    // Validación 1: Contexto válido
    if (!context) {
      toast.error('Error: Contexto de foro no disponible');
      return;
    }

    // Validación 2: Usuario tiene permiso de escribir
    if (!context.canWriteMessages) {
      toast.error('No tienes permiso para escribir en este foro');
      return;
    }

    const message = this.newMessage().trim();

    // Validación 3: Mensaje no está vacío
    if (!message) {
      toast.error('El mensaje no puede estar vacío');
      return;
    }

    // Activar estado de envío
    this.isSendingMessage.set(true);

    // Llamar al servicio para enviar mensaje
    this.foroService
      .createMessage(
        context.userId, // senderId
        context.creatorId, // receiverId
        context.tripId, // tripId
        message,
        1 // groupId por defecto
      )
      .subscribe({
        next: (response) => {
          // Agregar mensaje a lista local (optimistic update)
          if (response.newMessage && response.newMessage.length > 0) {
            let newMsg = response.newMessage[0];
            // Enriquecer el mensaje por si acaso no viene el objeto sender
            [newMsg] = this.enrichMessages([newMsg]);
            this.messages.update((msgs) => [newMsg, ...msgs]); // Agregar al inicio
          }

          // Limpiar input y mostrar éxito
          this.newMessage.set('');
          this.isSendingMessage.set(false);
          toast.success('Mensaje enviado correctamente');
        },
        error: (error) => {
          this.isSendingMessage.set(false);
          toast.error('Error al enviar mensaje. Intenta de nuevo.');
        },
      });
  }

  /**
   * Mostrar confirmación para eliminar un mensaje
   * Usa un toast modal para pedir confirmación al usuario
   *
   * Permisos:
   * - El creador del viaje puede eliminar cualquier mensaje
   * - Los demás usuarios solo pueden eliminar sus propios mensajes
   *
   * @param message - El mensaje a eliminar
   */
  mostrarConfirmacionEliminar(message: ForumMessage): void {
    const context = this.forumContext();

    // Validación 1: Contexto válido
    if (!context) {
      toast.error('Error: Contexto de foro no disponible');
      return;
    }

    // Validación 2: Verificar permisos de eliminación
    // El creador puede eliminar cualquier mensaje
    // Los otros usuarios solo pueden eliminar sus propios mensajes
    const esCreador = context.userRole === 'creator';
    const esDelUsuario = message.sender_id === context.userId;
    const tienePermiso = esCreador || esDelUsuario;

    if (!tienePermiso) {
      toast.error('No tienes permiso para eliminar este mensaje');
      return;
    }

    // Preparar el toast de confirmación
    this.mensajePendiente.set(message);
    this.mensajeConfirmacion.set(`¿Eliminar este mensaje? Esta acción no se puede deshacer.`);
    this.ocultandoToastConfirmacion.set(false);
    this.mostrarToastConfirmacion.set(true);
  }

  /**
   * Confirmar y ejecutar la eliminación del mensaje
   * Se llama cuando el usuario hace clic en "Eliminar" en el toast
   */
  confirmarEliminacionMensaje(): void {
    const message = this.mensajePendiente();

    if (message) {
      this.ocultarToastConfirmacion();
      // Esperar a que se anule la animación antes de eliminar
      setTimeout(() => {
        this.eliminarMensaje(message);
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
      this.mensajePendiente.set(null);
    }, 300);
  }

  /**
   * Elimina un mensaje del foro (optimistic update)
   * 1. Actualiza la UI inmediatamente (optimistic update)
   * 2. Hace la petición DELETE
   * 3. Si falla, revierte los cambios
   *
   * @param message - El mensaje a eliminar
   */
  private eliminarMensaje(message: ForumMessage): void {
    // Eliminación optimista - remover del UI inmediatamente
    const previousMessages = this.messages();
    this.messages.update((msgs) => msgs.filter((msg) => msg.id !== message.id));

    // Llamar al servicio para eliminar en el API
    this.foroService.deleteMessage(message.id).subscribe({
      next: (response) => {
        toast.success('Mensaje eliminado correctamente');
      },
      error: (error) => {
        // Revertir cambios si la API falla
        this.messages.set(previousMessages);

        const errorMsg = error?.message || 'Error al eliminar el mensaje';
        toast.error(errorMsg);
      },
    });
  }

  /**
   * Elimina un mensaje del foro
   *
   * Validaciones:
   * - El usuario es el creador del mensaje
   * - Solicita confirmación antes de eliminar (mediante toast modal)
   * - Realiza eliminación optimista (remueve del UI inmediatamente)
   * - Revierte cambios si la API falla
   *
   * @param message - El mensaje a eliminar
   */
  deleteMessage(message: ForumMessage): void {
    this.mostrarConfirmacionEliminar(message);
  }

  /**
   * Carga los participantes de un viaje para enriquecer mensajes
   * Construye un mapa de user_id -> {username, email}
   *
   * @param tripId - ID del viaje
   */
  loadTripParticipants(tripId: number): void {
    this.participantService.getTripParticipations(tripId).subscribe({
      next: (response) => {
        // Crear mapa de participantes para acceso rápido
        const newMap = new Map<number, { username: string; email: string }>();
        response.data.forEach((participant: TripParticipation) => {
          newMap.set(participant.user_id, {
            username: participant.username,
            email: participant.email,
          });
        });

        this.participantsMap.set(newMap);
      },
      error: (error) => {
        // No es crítico - continuar sin mapa de participantes
      },
    });
  }

  /**
   * Carga los mensajes de un viaje específico
   * Se ejecuta en ngOnInit y puede ser llamada para refrescar
   *
   * @param tripId - ID del viaje
   * @param page - Número de página (default: 1)
   * @param perPage - Mensajes por página (default: 10)
   */
  loadMessages(tripId: number, page: number = 1, perPage: number = 10): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.foroService.getMessages(tripId, page, perPage).subscribe({
      next: (response: GetMessagesResponse) => {
        // Extraer mensajes de la estructura anidada
        let loadedMessages = response.results.results || [];

        // Enriquecer mensajes con info del usuario
        loadedMessages = this.enrichMessages(loadedMessages);

        this.messages.set(loadedMessages);

        // Actualizar información de paginación
        this.paginationInfo.set({
          page: response.results.page || 1,
          perPage: response.results.per_page || 10,
          total: response.results.total || 0,
          totalPages: response.results.total_pages || 0,
        });

        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set('Error al cargar los mensajes del foro. Intenta de nuevo.');
        toast.error('Error al cargar mensajes');
      },
    });
  }

  /**
   * Enriquecer los mensajes cargados con información del usuario
   * Agrega el objeto sender basándose en sender_id
   *
   * Orden de búsqueda:
   * 1. Si ya tiene objeto sender embebido → usarlo
   * 2. Si es el creador → obtener del contexto
   * 3. Si es el usuario actual → obtener del localStorage
   * 4. Buscar en mapa de participantes del viaje
   * 5. Dejar como está si no encuentra
   *
   * @param messages - Mensajes a enriquecer
   * @returns Mensajes enriquecidos
   */
  enrichMessages(messages: ForumMessage[]): ForumMessage[] {
    const context = this.forumContext();
    const participants = this.participantsMap();

    return messages.map((msg) => {
      // Ruta 1: Si ya tiene el objeto sender, no hacer nada
      if (msg.sender) {
        return msg;
      }

      // Ruta 2: Si el sender_id es el creador, agregar info del contexto
      if (context && msg.sender_id === context.creatorId && !msg.sender) {
        return {
          ...msg,
          sender: {
            id: context.creatorId,
            username: context.creatorUsername,
            email: '',
          },
        };
      }

      // Ruta 3: Si es el usuario actual, obtener del localStorage
      if (context && msg.sender_id === context.userId && !msg.sender) {
        try {
          const usuarioStr = localStorage.getItem('usuario');
          if (usuarioStr) {
            const usuario = JSON.parse(usuarioStr);
            return {
              ...msg,
              sender: {
                id: context.userId,
                username: usuario.username || usuario.user_name || 'Usuario',
                email: usuario.email || '',
              },
            };
          }
        } catch (e) {
          console.warn('No se pudo obtener datos del usuario actual');
        }
      }

      // Ruta 4: Buscar en mapa de participantes del viaje
      if (participants.has(msg.sender_id)) {
        const participant = participants.get(msg.sender_id);
        if (participant) {
          return {
            ...msg,
            sender: {
              id: msg.sender_id,
              username: participant.username,
              email: participant.email,
            },
          };
        }
      }

      // Ruta 5: No se pudo enriquecer, dejar como está
      return msg;
    });
  }

  /**
   * Refrescar los mensajes del foro
   * Útil para que el usuario pueda actualizar manualmente
   */
  refreshMessages(): void {
    const context = this.forumContext();
    if (context) {
      this.loadMessages(context.tripId);
    }
  }

  /**
   * Navegar de vuelta a la pestaña de "Mis Viajes" en gestion-viajes
   * Limpia la sesión de foro y redirige al componente pending-participations
   * mostrando la pestaña de "Mis Viajes" (myTrips)
   */
  goBackToMisViajes(): void {
    // Limpiar el contexto del foro de sessionStorage
    sessionStorage.removeItem('forumContext');

    // Navegar a la ruta de gestion-viajes
    // El componente PendingParticipationsComponent verá la pestaña myTrips por defecto
    this.router.navigate(['/gestion-viajes']);
  }

  /**
   * Verifica si el usuario actual es el creador del viaje
   */
  isCreator(): boolean {
    const context = this.forumContext();
    return context ? context.userRole === 'creator' : false;
  }

  /**
   * Verifica si el usuario puede escribir mensajes
   */
  canWriteMessages(): boolean {
    const context = this.forumContext();
    return context ? context.canWriteMessages : false;
  }

  /**
   * Verifica si el usuario puede leer mensajes
   */
  canReadMessages(): boolean {
    const context = this.forumContext();
    return context ? context.canReadMessages : false;
  }

  /**
   * Verificar si un mensaje fue enviado por el usuario actual
   * @param message - El mensaje a verificar
   */
  isOwnMessage(message: ForumMessage): boolean {
    const context = this.forumContext();
    return context ? message.sender_id === context.userId : false;
  }

  /**
   * Verificar si el usuario tiene permiso para eliminar un mensaje
   * El creador puede eliminar cualquier mensaje
   * Los demás usuarios solo pueden eliminar sus propios mensajes
   *
   * @param message - El mensaje a verificar
   * @returns true si el usuario puede eliminar el mensaje
   */
  canDeleteMessage(message: ForumMessage): boolean {
    const context = this.forumContext();
    if (!context) return false;

    // El creador puede eliminar cualquier mensaje
    const esCreador = context.userRole === 'creator';
    // Los demás pueden eliminar solo sus propios mensajes
    const esDelUsuario = message.sender_id === context.userId;

    return esCreador || esDelUsuario;
  }

  /**
   * Obtener el nombre del usuario que envió el mensaje
   * Con fallback múltiple: sender embebido → contexto → localStorage → participantes → Anónimo
   *
   * @param message - El mensaje a verificar
   * @returns Nombre del usuario o "Anónimo"
   */
  getSenderName(message: ForumMessage): string {
    // Ruta 1: Obtener del objeto sender embebido
    if (message.sender?.username) {
      return message.sender.username;
    }

    // Ruta 2: Verificar si es el creador del contexto
    const context = this.forumContext();
    if (context && message.sender_id === context.creatorId && context.creatorUsername) {
      return context.creatorUsername;
    }

    // Ruta 3: Verificar si es el usuario actual en localStorage
    if (context && message.sender_id === context.userId) {
      try {
        const usuarioStr = localStorage.getItem('usuario');
        if (usuarioStr) {
          const usuario = JSON.parse(usuarioStr);
          const username = usuario.username || usuario.user_name || 'Usuario';
          return username;
        }
      } catch (e) {
        // Error al obtener datos de localStorage
      }
    }

    // Ruta 4: Buscar en mapa de participantes
    const participants = this.participantsMap();
    if (participants.has(message.sender_id)) {
      const participant = participants.get(message.sender_id);
      if (participant?.username) {
        return participant.username;
      }
    }

    // Ruta 5: Fallback final
    return 'Anónimo';
  }

  /**
   * Formatea la fecha del mensaje para mostrar
   * @param dateString - Fecha ISO string del API
   */
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();

      if (isToday) {
        // Mostrar solo hora si es hoy
        return date.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        });
      } else {
        // Mostrar fecha completa si es otro día
        return date.toLocaleDateString('es-ES', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch {
      return dateString;
    }
  }
}
