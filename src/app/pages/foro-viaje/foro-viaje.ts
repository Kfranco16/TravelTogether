import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ForoService, ForumMessage, GetMessagesResponse } from '../../core/services/foro.service';
import { ForumAccessContext } from '../../core/interfaces/forum-access-context';
import { ParticipantService, TripParticipation } from '../../core/services/participant.service';
import { NotificationsService } from '../../core/services/notifications';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-foro-viaje',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './foro-viaje.html',
  styleUrls: ['./foro-viaje.css'],
})
export class ForoViaje implements OnInit {
  private foroService = inject(ForoService);
  private participantService = inject(ParticipantService);
  private notificationsService = inject(NotificationsService);
  private router = inject(Router);

  forumContext = signal<ForumAccessContext | null>(null);
  accessDenied = signal<boolean>(false);
  tripTitle = signal<string>('');
  messages = signal<ForumMessage[]>([]);
  isLoading = signal<boolean>(true);
  isSendingMessage = signal<boolean>(false);
  newMessage = signal<string>('');
  errorMessage = signal<string | null>(null);
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
  private participantsMap = signal<Map<number, { username: string; email: string }>>(new Map());
  mostrarToastConfirmacion = signal<boolean>(false);
  mensajeConfirmacion = signal<string>('');
  mensajePendiente = signal<ForumMessage | null>(null);
  ocultandoToastConfirmacion = signal<boolean>(false);

  ngOnInit(): void {
    const contextStr = sessionStorage.getItem('forumContext');

    if (!contextStr) {
      this.accessDenied.set(true);
      this.errorMessage.set('Error: No se pudo validar tu acceso al foro');
      this.isLoading.set(false);
      toast.error('Acceso denegado al foro');

      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 2000);
      return;
    }

    try {
      const context = JSON.parse(contextStr) as ForumAccessContext;

      if (!context.tripId || !context.userId) {
        throw new Error('Contexto incompleto');
      }

      this.forumContext.set(context);
      this.tripTitle.set(context.tripTitle);
      this.loadTripParticipants(context.tripId);
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

  sendMessage(): void {
    const context = this.forumContext();

    if (!context) {
      toast.error('Error: Contexto de foro no disponible');
      return;
    }

    if (!context.canWriteMessages) {
      toast.error('No tienes permiso para escribir en este foro');
      return;
    }

    const message = this.newMessage().trim();

    if (!message) {
      toast.error('El mensaje no puede estar vacío');
      return;
    }

    this.isSendingMessage.set(true);

    this.foroService
      .createMessage(context.userId, context.creatorId, context.tripId, message)
      .subscribe({
        next: (response) => {
          if (response.newMessage && response.newMessage.length > 0) {
            let newMsg = response.newMessage[0];
            [newMsg] = this.enrichMessages([newMsg]);
            this.messages.update((msgs) => [newMsg, ...msgs]);
          }

          this.newMessage.set('');
          this.isSendingMessage.set(false);
          toast.success('Mensaje enviado correctamente');

          const token = localStorage.getItem('token') ?? '';
          if (token) {
            const participantsMap = this.participantsMap();
            const tripTitle = context.tripTitle;

            participantsMap.forEach((_info, userId) => {
              if (userId === context.userId) {
                return;
              }

              const notiBody = {
                title: 'Nuevo mensaje en el foro',
                message: `Han escrito en el foro de "${tripTitle}".`,
                type: 'message',
                sender_id: context.userId,
                receiver_id: userId,
              };

              this.notificationsService.create(notiBody, token).subscribe({
                next: () => {},
                error: (err) => {
                  console.error('Error creando notificación de foro para', userId, err);
                },
              });
            });
          }
        },
        error: () => {
          this.isSendingMessage.set(false);
          toast.error('Error al enviar mensaje. Intenta de nuevo.');
        },
      });
  }

  mostrarConfirmacionEliminar(message: ForumMessage): void {
    const context = this.forumContext();

    if (!context) {
      toast.error('Error: Contexto de foro no disponible');
      return;
    }

    const esCreador = context.userRole === 'creator';
    const esDelUsuario = message.sender_id === context.userId;
    const tienePermiso = esCreador || esDelUsuario;

    if (!tienePermiso) {
      toast.error('No tienes permiso para eliminar este mensaje');
      return;
    }

    this.mensajePendiente.set(message);
    this.mensajeConfirmacion.set(`¿Eliminar este mensaje? Esta acción no se puede deshacer.`);
    this.ocultandoToastConfirmacion.set(false);
    this.mostrarToastConfirmacion.set(true);
  }

  confirmarEliminacionMensaje(): void {
    const message = this.mensajePendiente();

    if (message) {
      this.ocultarToastConfirmacion();
      setTimeout(() => {
        this.eliminarMensaje(message);
      }, 300);
    }
  }

  cancelarEliminacion(): void {
    this.ocultarToastConfirmacion();
  }

  ocultarToastConfirmacion(): void {
    this.ocultandoToastConfirmacion.set(true);

    setTimeout(() => {
      this.mostrarToastConfirmacion.set(false);
      this.ocultandoToastConfirmacion.set(false);
      this.mensajePendiente.set(null);
    }, 300);
  }

  private eliminarMensaje(message: ForumMessage): void {
    const previousMessages = this.messages();
    this.messages.update((msgs) => msgs.filter((msg) => msg.id !== message.id));

    this.foroService.deleteMessage(message.id).subscribe({
      next: () => {
        toast.success('Mensaje eliminado correctamente');
      },
      error: (error) => {
        this.messages.set(previousMessages);
        const errorMsg = error?.message || 'Error al eliminar el mensaje';
        toast.error(errorMsg);
      },
    });
  }

  deleteMessage(message: ForumMessage): void {
    this.mostrarConfirmacionEliminar(message);
  }

  loadTripParticipants(tripId: number): void {
    this.participantService.getTripParticipations(tripId).subscribe({
      next: (response) => {
        const newMap = new Map<number, { username: string; email: string }>();
        response.data.forEach((participant: TripParticipation) => {
          newMap.set(participant.user_id, {
            username: participant.username,
            email: participant.email,
          });
        });

        this.participantsMap.set(newMap);
      },
      error: () => {},
    });
  }

  loadMessages(tripId: number, page: number = 1, perPage: number = 10): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.foroService.getMessages(tripId, page, perPage).subscribe({
      next: (response: GetMessagesResponse) => {
        let loadedMessages = response.results.results || [];
        loadedMessages = this.enrichMessages(loadedMessages);

        this.messages.set(loadedMessages);

        this.paginationInfo.set({
          page: response.results.page || 1,
          perPage: response.results.per_page || 10,
          total: response.results.total || 0,
          totalPages: response.results.total_pages || 0,
        });

        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Error al cargar los mensajes del foro. Intenta de nuevo.');
        toast.error('Error al cargar mensajes');
      },
    });
  }

  enrichMessages(messages: ForumMessage[]): ForumMessage[] {
    const context = this.forumContext();
    const participants = this.participantsMap();

    return messages.map((msg) => {
      if (msg.sender) {
        return msg;
      }

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
        } catch {}
      }

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

      return msg;
    });
  }

  refreshMessages(): void {
    const context = this.forumContext();
    if (context) {
      this.loadMessages(context.tripId);
    }
  }

  goBackToMisViajes(): void {
    sessionStorage.removeItem('forumContext');
    this.router.navigate(['/gestion-viajes']);
  }

  isCreator(): boolean {
    const context = this.forumContext();
    return context ? context.userRole === 'creator' : false;
  }

  canWriteMessages(): boolean {
    const context = this.forumContext();
    return context ? context.canWriteMessages : false;
  }

  canReadMessages(): boolean {
    const context = this.forumContext();
    return context ? context.canReadMessages : false;
  }

  isOwnMessage(message: ForumMessage): boolean {
    const context = this.forumContext();
    return context ? message.sender_id === context.userId : false;
  }

  canDeleteMessage(message: ForumMessage): boolean {
    const context = this.forumContext();
    if (!context) return false;

    const esCreador = context.userRole === 'creator';
    const esDelUsuario = message.sender_id === context.userId;

    return esCreador || esDelUsuario;
  }

  getSenderName(message: ForumMessage): string {
    if (message.sender?.username) {
      return message.sender.username;
    }

    const context = this.forumContext();
    if (context && message.sender_id === context.creatorId && context.creatorUsername) {
      return context.creatorUsername;
    }

    if (context && message.sender_id === context.userId) {
      try {
        const usuarioStr = localStorage.getItem('usuario');
        if (usuarioStr) {
          const usuario = JSON.parse(usuarioStr);
          const username = usuario.username || usuario.user_name || 'Usuario';
          return username;
        }
      } catch {}
    }

    const participants = this.participantsMap();
    if (participants.has(message.sender_id)) {
      const participant = participants.get(message.sender_id);
      if (participant?.username) {
        return participant.username;
      }
    }

    return 'Anónimo';
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();

      if (isToday) {
        return date.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        });
      } else {
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
