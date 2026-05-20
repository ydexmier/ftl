import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { TournamentPlayersDeckRepository } from '@/src/repositories/db/TournamentPlayersDeckRepository';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; tid: string }> },
) {
  const auth = await getAuthSession(req);
  if (!auth) return ApiResponse.unauthorized();

  const { id: groupId, tid } = await params;
  const tournamentId = Number(tid);
  if (isNaN(tournamentId)) return ApiResponse.badRequest('ID de tournoi invalide');

  const isMember = await GroupRepository.isMember(groupId, auth.userId);
  if (!isMember && auth.role !== 'ADMIN' && auth.role !== 'SUPERUSER') {
    return ApiResponse.forbidden();
  }

  try {
    const stats = await TournamentPlayersDeckRepository.getScoutingStats(tournamentId, { groupId });
    return ApiResponse.ok(stats);
  } catch (err) {
    return ApiResponse.serverError(err);
  }
}
