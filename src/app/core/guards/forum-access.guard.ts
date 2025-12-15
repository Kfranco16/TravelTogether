/**
 * ============================================================================
 * FORUM ACCESS GUARD
 * ============================================================================
 * Guard que valida si el usuario puede acceder a un foro específico
 * Verifica:
 * 1. ¿El usuario está logeado? (validado por authGuard)
 * 2. ¿El usuario es creador o tiene una participación aceptada?
 * 3. ¿El estado de su participación lo permite?
 *
 * Este guard debe ejecutarse DESPUÉS de authGuard en las rutas
 */

import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { ParticipantService } from '../services/participant.service';
import { firstValueFrom } from 'rxjs';
import { toast } from 'ngx-sonner';
import { ForumAccessContext, createForumAccessContext } from '../interfaces/forum-access-context';

/**
 * Guard funcional para validar acceso al foro
 * Se ejecuta antes de cargar ForoViaje component
 */
export const forumAccessGuard: CanActivateFn = async (route: ActivatedRouteSnapshot, state) => {
  const router = inject(Router);
  const participantService = inject(ParticipantService);

  const tripId = Number(route.paramMap.get('id'));

  if (!tripId || isNaN(tripId)) {
    toast.error('ID de viaje no válido');
    router.navigate(['/dashboard']);
    return false;
  }

  let userId: number | null = null;
  try {
    const usuarioStr = localStorage.getItem('usuario');
    if (!usuarioStr) {
      throw new Error('No hay usuario en localStorage');
    }
    const usuario = JSON.parse(usuarioStr);
    userId = usuario.id;

    if (!userId) {
      throw new Error('Usuario no tiene ID');
    }
  } catch (error) {
    toast.error('Error de autenticación');
    router.navigate(['/login']);
    return false;
  }

  try {
    const response = await firstValueFrom(participantService.getMyParticipations());
    const participation = response.data.find((p) => p.trip_id === tripId);

    if (!participation) {
      toast.error('No eres participante de este viaje');
      router.navigate(['/dashboard']);
      return false;
    }

    const isCreator = participation.creator_id === userId;
    const isAccepted = participation.status === 'accepted';
    const isPending = participation.status === 'pending';
    const isRejected = participation.status === 'rejected';

    if (isRejected) {
      toast.error('Tu solicitud fue rechazada. No puedes acceder al foro.');
      router.navigate(['/dashboard']);
      return false;
    }

    if (isPending && !isCreator) {
      toast.error('Tu participación aún está pendiente. Solo el creador puede acceder.');
      router.navigate(['/dashboard']);
      return false;
    }

    const forumContext: ForumAccessContext = createForumAccessContext(
      userId,
      tripId,
      participation.trip_name,
      participation.creator_id,
      participation.creator_username,
      participation.creator_image_url,
      participation.participation_id,
      participation.status as 'pending' | 'accepted' | 'rejected'
    );

    sessionStorage.setItem('forumContext', JSON.stringify(forumContext));
    return true;
  } catch (error) {
    toast.error('Error al validar acceso al foro');
    router.navigate(['/dashboard']);
    return false;
  }
};
