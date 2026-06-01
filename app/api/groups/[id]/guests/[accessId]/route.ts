import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { TournamentExternalAccessRepository } from '@/src/repositories/db/TournamentExternalAccessRepository';
import { TournamentRepository } from '@/src/repositories/db/TournamentRepository';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { sendGuestApprovedEmail } from '@/src/lib/email';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ id: string; accessId: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const { id, accessId } = await params;
  const { action } = await request.json() as { action: 'approve' | 'reject' | 'revoke' };

  if (action !== 'approve' && action !== 'reject' && action !== 'revoke') {
    return ApiResponse.badRequest('action invalide (approve | reject | revoke)');
  }

  const isAdmin = await GroupRepository.isAdmin(id, auth.userId);
  if (!isAdmin) return ApiResponse.forbidden();

  const access = await TournamentExternalAccessRepository.findById(accessId);
  if (!access) return ApiResponse.notFound('Accès introuvable');
  if (String(access.groupId) !== id) return ApiResponse.forbidden();

  if (action === 'approve') {
    if (access.status !== 'PENDING') return ApiResponse.badRequest('Cet accès n\'est pas en attente d\'approbation');
    const updated = await TournamentExternalAccessRepository.approve(accessId);

    // Notifier l'invité par email
    if (access.userId) {
      const [user, tournament] = await Promise.all([
        UserRepository.findById(String(access.userId)),
        TournamentRepository.findById(access.tournamentId),
      ]);
      if (user && tournament) {
        sendGuestApprovedEmail(user.email, user.username, tournament.name).catch(() => {});
      }
    }

    return ApiResponse.ok({ access: updated });
  }

  if (action === 'reject') {
    if (access.status !== 'PENDING') return ApiResponse.badRequest('Cet accès n\'est pas en attente d\'approbation');
    const updated = await TournamentExternalAccessRepository.reject(accessId);
    return ApiResponse.ok({ access: updated });
  }

  // revoke
  if (access.status === 'REVOKED' || access.status === 'EXPIRED' || access.status === 'REJECTED') {
    return ApiResponse.badRequest('Cet accès est déjà révoqué, expiré ou refusé');
  }
  const updated = await TournamentExternalAccessRepository.revokeAccess(accessId);
  return ApiResponse.ok({ access: updated });
}
