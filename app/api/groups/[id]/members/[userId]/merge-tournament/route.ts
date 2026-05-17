import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { GroupTournamentRepository } from '@/src/repositories/db/GroupTournamentRepository';
import { DataMergeService } from '@/src/services/DataMergeService';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ id: string; userId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const { id: groupId, userId } = await params;

  const isAdmin = await GroupRepository.isAdmin(groupId, auth.userId);
  if (!isAdmin) return ApiResponse.forbidden();

  try {
    const { tournamentId } = await request.json();
    if (!tournamentId || typeof tournamentId !== 'number') {
      return ApiResponse.badRequest('tournamentId requis');
    }

    const isMember = await GroupRepository.isMember(groupId, userId);
    if (!isMember) return ApiResponse.notFound('Membre introuvable dans ce groupe');

    const hasAccess = await GroupTournamentRepository.hasAccess(groupId, tournamentId);
    if (!hasAccess) return ApiResponse.notFound('Tournoi introuvable dans ce groupe');

    const conflicts = await DataMergeService.mergeUserForTournament(userId, groupId, tournamentId);

    return ApiResponse.ok({ success: true, conflicts });
  } catch (err) {
    return ApiResponse.serverError(err);
  }
}
