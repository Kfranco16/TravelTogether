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
 *
 * Flujo:
 * 1. Extrae tripId de los parámetros de la ruta
 * 2. Obtiene userId del localStorage
 * 3. Busca la participación del usuario en ese viaje
 * 4. Valida que el usuario tenga acceso
 * 5. Crea el ForumAccessContext y lo guarda en sessionStorage
 * 6. Retorna true/false para permitir o denegar acceso
 */
export const forumAccessGuard: CanActivateFn = async (route: ActivatedRouteSnapshot, state) => {
  const router = inject(Router);
  const participantService = inject(ParticipantService);

  // ========================================================================
  // PASO 1: Extraer el tripId de la ruta
  // ========================================================================
  const tripId = Number(route.paramMap.get('id'));

  if (!tripId || isNaN(tripId)) {
    console.error('❌ ID de viaje no válido:', tripId);
    toast.error('ID de viaje no válido');
    router.navigate(['/dashboard']);
    return false;
  }

  // ========================================================================
  // PASO 2: Obtener el userId del usuario logeado
  // ========================================================================
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
    console.error('❌ Error al obtener userId:', error);
    toast.error('Error de autenticación');
    router.navigate(['/login']);
    return false;
  }

  // ========================================================================
  // PASO 3: Obtener todas las participaciones del usuario
  // ========================================================================
  try {
    const response = await firstValueFrom(participantService.getMyParticipations());

    // ====================================================================
    // PASO 4: Buscar la participación en este viaje específico
    // ====================================================================
    const participation = response.data.find((p) => p.trip_id === tripId);

    if (!participation) {
      console.warn(`⚠️ Usuario ${userId} no es participante del viaje ${tripId}`);
      toast.error('No eres participante de este viaje');
      router.navigate(['/dashboard']);
      return false;
    }

    // ====================================================================
    // PASO 5: Validar el estado de la participación
    // ====================================================================
    const isCreator = participation.creator_id === userId;
    const isAccepted = participation.status === 'accepted';
    const isPending = participation.status === 'pending';
    const isRejected = participation.status === 'rejected';

    // ❌ Rechazado: sin acceso
    if (isRejected) {
      console.warn(`⚠️ Usuario ${userId} tiene participación RECHAZADA en viaje ${tripId}`);
      toast.error('Tu solicitud fue rechazada. No puedes acceder al foro.');
      router.navigate(['/dashboard']);
      return false;
    }

    // ❌ Pendiente y NO es creador: sin acceso
    if (isPending && !isCreator) {
      console.warn(`⚠️ Usuario ${userId} tiene participación PENDIENTE en viaje ${tripId}`);
      toast.error('Tu participación aún está pendiente. Solo el creador puede acceder.');
      router.navigate(['/dashboard']);
      return false;
    }

    // ✅ Todo validado correctamente
    // Ahora crear el contexto de acceso
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

    // ====================================================================
    // PASO 6: Guardar el contexto en sessionStorage
    // ====================================================================
    sessionStorage.setItem('forumContext', JSON.stringify(forumContext));

    console.log(`✅ Acceso permitido a foro ${tripId} para usuario ${userId}`, forumContext);

    return true;
  } catch (error) {
    console.error('❌ Error al validar acceso al foro:', error);
    toast.error('Error al validar acceso al foro');
    router.navigate(['/dashboard']);
    return false;
  }
};
