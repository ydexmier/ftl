import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { TournamentExternalAccessRepository } from '@/src/repositories/db/TournamentExternalAccessRepository';
import { TournamentRepository } from '@/src/repositories/db/TournamentRepository';
import { ApiResponse } from '@/src/lib/api/responses';

export async function GET(request: NextRequest) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const accesses = await TournamentExternalAccessRepository.findByUserId(auth.userId);

  if (accesses.length === 0) return ApiResponse.ok({ tournaments: [] });

  const tournamentIds = [...new Set(accesses.map((a) => a.tournamentId))];
  const tournaments = await TournamentRepository.findByIds(tournamentIds);
  const tournamentMap = Object.fromEntries(tournaments.map((t) => [t.id, t]));

  const result = accesses.map((a) => ({
    accessId: String(a._id),
    status: a.status,
    groupId: String(a.groupId),
    tournamentId: a.tournamentId,
    tournamentName: tournamentMap[a.tournamentId]?.name ?? `Tournoi #${a.tournamentId}`,
    expiresAt: a.expiresAt,
    createdAt: a.createdAt,
  }));

  return ApiResponse.ok({ tournaments: result });
}
