import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  ParticipantService,
  PendingParticipationInfo,
  MyCreatedTrip,
  MyCreatedTripsResponse,
  UserParticipation,
  TripParticipation,
} from '../../core/services/participant.service';
import {
  ForumAccessContext,
  createForumAccessContext,
} from '../../core/interfaces/forum-access-context';
import { toast } from 'ngx-sonner';
import { firstValueFrom, take } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { NotificationsService } from '../../core/services/notifications';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-pending-participations',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pending-participations.html',
  styleUrl: './pending-participations.css',
})
export class PendingParticipationsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private participantService = inject(ParticipantService);
  private router = inject(Router);
  private notificationsService = inject(NotificationsService);
  private authService = inject(AuthService);

  pendingParticipations: PendingParticipationInfo[] = [];
  myCreatedTrips: MyCreatedTrip[] = [];
  userParticipations: UserParticipation[] = [];
  userId: number | null = null;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  debugResponseData: any = null;
  activeTab: 'pending' | 'accepted' | 'myTrips' = 'pending';
  soloForos = false;

  pageTitle = 'Gestión de Viajes';
  tripParticipationsMap = new Map<number, TripParticipation[]>();

  mostrarToastConfirmacion = signal<boolean>(false);
  mensajeConfirmacion = signal<string>('');
  participationIdPendiente = signal<number | null>(null);
  tripIdPendiente = signal<number | null>(null);
  ocultandoToastConfirmacion = signal<boolean>(false);
  tipoEliminacion = signal<'acceptedParticipant' | 'userParticipation' | null>(null);

  ngOnInit(): void {
    // si necesitas userId para el foro, recógelo de tu AuthService aquí
    this.authService.user$.pipe(take(1)).subscribe((current) => {
      this.userId = current?.id ?? null;
    });

    this.route.queryParams.subscribe((params) => {
      const tab = params['tab'];
      const from = params['from'];

      if (tab === 'myTrips' && from === 'forum') {
        this.activeTab = 'myTrips';
        this.soloForos = true;
        this.pageTitle = 'Foros';
      } else {
        this.soloForos = false;
        this.pageTitle = 'Gestión de Viajes';

        this.activeTab =
          tab === 'accepted' || tab === 'myTrips' || tab === 'pending' ? tab : 'pending';
      }

      this.switchTab(this.activeTab);
    });
  }

  async loadPendingParticipations(): Promise<MyCreatedTripsResponse | void> {
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    try {
      const response = await firstValueFrom(this.participantService.getPendingParticipations());
      this.successMessage = response.message;
      this.pendingParticipations = response.data;
      this.debugResponseData = response;
    } catch (error: any) {
      const errorMsg = error?.message || 'Error al obtener solicitudes pendientes';
      this.errorMessage = errorMsg;

      toast.error(errorMsg, {
        description: 'Por favor, intenta de nuevo más tarde',
      });
    } finally {
      this.isLoading = false;
    }
  }

  refreshParticipations(): void {
    this.loadPendingParticipations();
  }

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

  async approveParticipation(participationId: number): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.participantService.approveParticipant(participationId)
      );
      toast.success('Participante aprobado correctamente');

      await this.loadPendingParticipations();
      await this.loadMyCreatedTrips();

      const token = this.authService.gettoken() || '';
      if (!token) {
        return;
      }

      const approved = this.pendingParticipations.find(
        (p) => p.participation_id === participationId
      );

      if (!approved) {
        return;
      }

      const tripId = approved.trip_id;
      const tripName = approved.trip_name;

      const tripParticipationsResponse = await firstValueFrom(
        this.participantService.getTripParticipations(tripId)
      );

      const participants: TripParticipation[] = tripParticipationsResponse.data ?? [];

      participants
        .filter((p) => p.user_id !== this.userId)
        .forEach((p) => {
          const notification = {
            title: 'Nuevo mensaje en el foro',
            message: `Han escrito en el foro de "${tripName}".`,
            type: 'message',
            sender_id: this.userId!,
            receiver_id: p.user_id,
          };

          this.notificationsService.create(notification, token).subscribe({
            next: () => {},
            error: (err) => {
              console.error(`Error creando notificación de foro para el usuario ${p.user_id}`, err);
            },
          });
        });
    } catch (error: any) {
      const errorMsg = error?.message || 'Error al aprobar participante';
      toast.error(errorMsg);
    }
  }

  async rejectParticipation(participationId: number): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.participantService.rejectParticipant(participationId)
      );
      toast.success('Participante rechazado correctamente');
      await this.loadPendingParticipations();

      // Si también quieres notificación al rechazar, puedes hacer algo parecido aquí.
    } catch (error: any) {
      const errorMsg = error?.message || 'Error al rechazar participante';
      toast.error(errorMsg);
    }
  }

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
    } catch (error: any) {
      const errorMsg = error?.message || 'Error al obtener viajes creados';
      this.errorMessage = errorMsg;

      toast.error(errorMsg, {
        description: 'Por favor, intenta de nuevo más tarde',
      });
    } finally {
      this.isLoading = false;
    }
  }

  async loadMyParticipations(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    try {
      const response = await firstValueFrom(this.participantService.getMyParticipations());

      this.successMessage = response.message;
      this.userParticipations = response.data;
      this.debugResponseData = response;
    } catch (error: any) {
      const errorMsg = error?.message || 'Error al obtener tus viajes';
      this.errorMessage = errorMsg;

      toast.error(errorMsg, {
        description: 'Por favor, intenta de nuevo más tarde',
      });
    } finally {
      this.isLoading = false;
    }
  }

  switchTab(tab: 'pending' | 'accepted' | 'myTrips'): void {
    this.activeTab = tab;

    if (tab === 'pending') {
      this.loadPendingParticipations();
    } else if (tab === 'accepted') {
      this.loadMyCreatedTrips().then(() => {
        if (this.myCreatedTrips.length > 0) {
          this.loadAllTripParticipations();
        }
      });
    } else if (tab === 'myTrips') {
      this.loadMyParticipations();
    }
  }

  async loadAllTripParticipations(): Promise<void> {
    this.isLoading = true;

    try {
      const tripIds = this.myCreatedTrips.map((trip) => trip.trip_id);
      const requests = tripIds.map((tripId) =>
        firstValueFrom(this.participantService.getTripParticipations(tripId))
      );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        if (response.data.length > 0) {
          const trip = this.myCreatedTrips.find((t) => {
            return response.data.some((p: any) => p.user_id !== this.userId);
          });

          if (trip) {
            this.tripParticipationsMap.set(trip.trip_id, response.data);
          }
        }
      });
    } catch (error: any) {
      const errorMsg = error?.message || 'Error al cargar participantes';
      this.errorMessage = errorMsg;
      toast.error(errorMsg);
    } finally {
      this.isLoading = false;
    }
  }

  getTripParticipations(tripId: number): TripParticipation[] {
    if (this.tripParticipationsMap.has(tripId)) {
      return this.tripParticipationsMap.get(tripId) || [];
    }

    const cached = this.participantService.getCachedTripParticipations(tripId);
    if (cached) {
      this.tripParticipationsMap.set(tripId, cached);
      return cached;
    }

    return [];
  }

  getParticipationId(tripId: number, userId: number): number | null {
    const participations = this.getTripParticipations(tripId);
    const participation = participations.find((p) => p.user_id === userId);
    return participation ? participation.participation_id : null;
  }

  mostrarConfirmacionEliminar(
    participationId: number,
    tripId: number,
    participantName: string
  ): void {
    this.participationIdPendiente.set(participationId);
    this.tripIdPendiente.set(tripId);
    this.tipoEliminacion.set('acceptedParticipant');
    this.mensajeConfirmacion.set(
      `¿Eliminar a ${participantName} de este viaje? Esta acción no se puede deshacer.`
    );
    this.ocultandoToastConfirmacion.set(false);
    this.mostrarToastConfirmacion.set(true);
  }

  confirmarEliminacion(): void {
    const participationId = this.participationIdPendiente();
    const tripId = this.tripIdPendiente();
    const tipo = this.tipoEliminacion();

    if (participationId && tripId && tipo) {
      this.ocultarToastConfirmacion();
      setTimeout(() => {
        if (tipo === 'acceptedParticipant') {
          this.deleteParticipant(participationId, tripId);
        } else if (tipo === 'userParticipation') {
          this.cancelUserParticipation(participationId, tripId);
        }
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
      this.participationIdPendiente.set(null);
      this.tripIdPendiente.set(null);
      this.tipoEliminacion.set(null);
    }, 300);
  }

  async deleteParticipant(participationId: number, tripId: number): Promise<void> {
    const participations = this.tripParticipationsMap.get(tripId) || [];
    const deletedParticipation = participations.find((p) => p.participation_id === participationId);

    if (!deletedParticipation) {
      toast.error('No se encontró el participante');
      return;
    }

    try {
      const updatedParticipations = participations.filter(
        (p) => p.participation_id !== participationId
      );
      this.tripParticipationsMap.set(tripId, updatedParticipations);

      const response = await firstValueFrom(
        this.participantService.deleteParticipant(participationId)
      );

      const trip = this.myCreatedTrips.find((t) => t.trip_id === tripId);
      if (trip) {
        trip.current_participants = Math.max(0, trip.current_participants - 1);
      }

      toast.success('Participante eliminado correctamente', {
        description: response.message,
      });
    } catch (error: any) {
      this.tripParticipationsMap.set(tripId, participations);

      const errorMsg = error?.message || 'Error al eliminar participante';
      this.errorMessage = errorMsg;

      toast.error(errorMsg, {
        description: 'Por favor, intenta de nuevo más tarde',
      });
    }
  }

  async cancelUserParticipation(participationId: number, tripId: number): Promise<void> {
    const originalParticipations = [...this.userParticipations];

    try {
      const participationToRemove = this.userParticipations.find(
        (p) => p.participation_id === participationId
      );

      if (!participationToRemove) {
        toast.error('No se encontró la participación');
        return;
      }

      this.userParticipations = this.userParticipations.filter(
        (p) => p.participation_id !== participationId
      );

      const response = await firstValueFrom(
        this.participantService.deleteParticipant(participationId)
      );

      toast.success('Participación cancelada correctamente', {
        description: response.message,
      });
    } catch (error: any) {
      this.userParticipations = originalParticipations;

      const errorMsg = error?.message || 'Error al cancelar participación';
      this.errorMessage = errorMsg;

      toast.error(errorMsg, {
        description: 'Por favor, intenta de nuevo más tarde',
      });
    }
  }

  getAcceptedParticipants(trip: MyCreatedTrip) {
    return (trip.accepted_participants ?? []).filter(
      (p) => p.status === 'accepted' && p.id !== trip.creator_id
    );
  }

  isMyTrip(participation: UserParticipation): boolean {
    return participation.creator_id === this.userId;
  }

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

  accederAlForo(participation: UserParticipation): void {
    const forumContext: ForumAccessContext = createForumAccessContext(
      this.userId!,
      participation.trip_id,
      participation.trip_name,
      participation.creator_id,
      participation.creator_username,
      participation.creator_image_url,
      participation.participation_id,
      participation.status as 'pending' | 'accepted' | 'rejected'
    );

    sessionStorage.setItem('forumContext', JSON.stringify(forumContext));
    this.router.navigate(['/foro', participation.trip_id]);
  }

  mostrarConfirmacionCancelarParticipacion(participation: UserParticipation): void {
    this.participationIdPendiente.set(participation.participation_id);
    this.tripIdPendiente.set(participation.trip_id);
    this.tipoEliminacion.set('userParticipation');
    this.mensajeConfirmacion.set(
      `¿Deseas cancelar tu participación en "${participation.trip_name}"? Esta acción no se puede deshacer.`
    );
    this.ocultandoToastConfirmacion.set(false);
    this.mostrarToastConfirmacion.set(true);
  }

  canCancelParticipation(participation: UserParticipation): boolean {
    return !this.isMyTrip(participation);
  }
}
