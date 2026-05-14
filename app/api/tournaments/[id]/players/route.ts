import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { TournamentPlayersDeckRepository } from '@/src/repositories/db/TournamentPlayersDeckRepository';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthSession(req);
  if (!auth) return ApiResponse.unauthorized();

  const { id } = await params;
  const tournamentId = Number(id);
  if (isNaN(tournamentId)) return ApiResponse.badRequest('ID de tournoi invalide');

  const url = new URL(req.url);
  const groupId = url.searchParams.get('groupId');

  let scope: { groupId?: string | null; userId?: string | null };
  if (groupId) {
    const isMember = await GroupRepository.isMember(groupId, auth.userId);
    if (!isMember && auth.role !== 'ADMIN' && auth.role !== 'SUPERUSER') {
      return ApiResponse.forbidden();
    }
    scope = { groupId };
  } else {
    scope = { userId: auth.userId };
  }

  try {
    const data = await TournamentPlayersDeckRepository.findByScope(tournamentId, scope);
    return ApiResponse.ok({ players: data?.players ?? [] });
  } catch (err) {
    return ApiResponse.serverError(err);
  }
}
