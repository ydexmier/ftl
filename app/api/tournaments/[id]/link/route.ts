import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { TournamentRepository } from '@/src/repositories/db/TournamentRepository';
import { UserTournamentRepository } from '@/src/repositories/db/UserTournamentRepository';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { GroupTournamentRepository } from '@/src/repositories/db/GroupTournamentRepository';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await getAuthSession(request);
    if (!session) return ApiResponse.unauthorized();

    const { id } = await params;
    const tournamentId = Number(id);
    if (isNaN(tournamentId) || tournamentId <= 0) return ApiResponse.badRequest('ID invalide');

    const tournament = await TournamentRepository.findById(tournamentId);
    if (!tournament) return ApiResponse.notFound('Tournoi introuvable');

    const groups = await GroupRepository.findByMemberId(session.userId);
    for (const group of groups) {
      const hasIt = await GroupTournamentRepository.hasAccess(String(group._id), tournamentId);
      if (hasIt) return ApiResponse.conflict('Ce tournoi est déjà géré par un de vos groupes');
    }

    const alreadyLinked = await UserTournamentRepository.existsByUserAndTournament(session.userId, tournamentId);
    if (alreadyLinked) return ApiResponse.conflict('Tournoi déjà lié');

    const link = await UserTournamentRepository.create(session.userId, tournamentId);
    return ApiResponse.created(link);
  } catch (err) {
    return ApiResponse.serverError(err);
  }
}
