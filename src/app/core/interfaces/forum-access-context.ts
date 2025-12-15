/**
 * ============================================================================
 * FORUM ACCESS CONTEXT INTERFACE
 * ============================================================================
 * Define los permisos y contexto de acceso a un foro específico
 * Se usa para validar qué puede hacer cada usuario en cada foro
 */

/**
 * Contexto de acceso al foro
 * Contiene toda la información necesaria para validar permisos
 */
export interface ForumAccessContext {
  // ========================================================================
  // INFORMACIÓN DEL VIAJE Y USUARIO
  // ========================================================================

  /** ID del viaje al que pertenece el foro */
  tripId: number;

  /** ID del usuario logeado */
  userId: number;

  /** Rol del usuario en este foro */
  userRole: 'creator' | 'accepted_member' | 'pending_member' | 'rejected_member';

  // ========================================================================
  // INFORMACIÓN DEL VIAJE
  // ========================================================================

  /** Título del viaje */
  tripTitle: string;

  /** ID del creador del viaje */
  creatorId: number;

  /** Nombre del creador del viaje */
  creatorUsername: string;

  /** Imagen del creador */
  creatorImage: string | null;

  // ========================================================================
  // INFORMACIÓN DE PARTICIPACIÓN
  // ========================================================================

  /** Estado de la participación del usuario */
  participationStatus: 'pending' | 'accepted' | 'rejected';

  /** ID de la participación */
  participationId: number;

  // ========================================================================
  // PERMISOS DEL USUARIO
  // ========================================================================

  /** ¿Puede leer mensajes del foro? */
  canReadMessages: boolean;

  /** ¿Puede escribir mensajes en el foro? */
  canWriteMessages: boolean;

  /** ¿Puede eliminar sus propios mensajes? */
  canDeleteOwnMessages: boolean;

  /** ¿Puede eliminar mensajes de otros? (solo creador) */
  canDeleteOthersMessages: boolean;

  /** ¿Puede editar sus propios mensajes? */
  canEditOwnMessages: boolean;

  /** ¿Puede eliminar participantes? (solo creador) */
  canManageParticipants: boolean;
}

/**
 * Utility function para crear el contexto
 * Se usa después de validar el acceso
 */
export function createForumAccessContext(
  userId: number,
  tripId: number,
  tripTitle: string,
  creatorId: number,
  creatorUsername: string,
  creatorImage: string | null,
  participationId: number,
  participationStatus: 'pending' | 'accepted' | 'rejected'
): ForumAccessContext {
  // Determinar el rol del usuario
  const isCreator = userId === creatorId;
  const isAccepted = participationStatus === 'accepted';
  const isRejected = participationStatus === 'rejected';
  const isPending = participationStatus === 'pending';

  let userRole: 'creator' | 'accepted_member' | 'pending_member' | 'rejected_member';

  if (isCreator) {
    userRole = 'creator';
  } else if (isAccepted) {
    userRole = 'accepted_member';
  } else if (isPending) {
    userRole = 'pending_member';
  } else {
    userRole = 'rejected_member';
  }

  // Determinar permisos basados en rol y status
  const canReadMessages = isCreator || isAccepted;
  const canWriteMessages = isCreator || isAccepted;
  const canDeleteOwnMessages = isCreator || isAccepted;
  const canDeleteOthersMessages = isCreator;
  const canEditOwnMessages = isCreator || isAccepted;
  const canManageParticipants = isCreator;

  return {
    tripId,
    userId,
    userRole,
    tripTitle,
    creatorId,
    creatorUsername,
    creatorImage,
    participationStatus,
    participationId,
    canReadMessages,
    canWriteMessages,
    canDeleteOwnMessages,
    canDeleteOthersMessages,
    canEditOwnMessages,
    canManageParticipants,
  };
}
