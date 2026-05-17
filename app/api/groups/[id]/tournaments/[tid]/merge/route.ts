import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { GroupTournamentRepository } from '@/src/repositories/db/GroupTournamentRepository';
import { DataMergeService } from '@/src/services/DataMergeService';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ id: string; tid: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  try {
    const { id: groupId, tid } = await params;
    const tournamentId = Number(tid);

    const isMember = await GroupRepository.isMember(groupId, auth.userId);
    if (!isMember) return ApiResponse.forbidden();

    const hasAccess = await GroupTournamentRepository.hasAccess(groupId, tournamentId);
    if (!hasAccess) return ApiResponse.notFound('Tournoi introuvable dans ce groupe');

    await DataMergeService.mergeUserForTournament(auth.userId, groupId, tournamentId);

    return ApiResponse.ok({ success: true });
  } catch (err) {
    return ApiResponse.serverError(err);
  }
}
