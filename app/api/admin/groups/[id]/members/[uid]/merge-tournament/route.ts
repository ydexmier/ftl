import { NextRequest } from 'next/server';
import { requireAdminSession } from '@/src/lib/auth/getAuthSession';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { GroupTournamentRepository } from '@/src/repositories/db/GroupTournamentRepository';
import { DataMergeService } from '@/src/services/DataMergeService';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ id: string; uid: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const result = await requireAdminSession(request);
  if ('error' in result) return result.error;

  const { id: groupId, uid: userId } = await params;

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
