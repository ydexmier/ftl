import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { UserTournamentRepository } from '@/src/repositories/db/UserTournamentRepository';
import { ApiResponse } from '@/src/lib/api/responses';
import type { UserTournamentStatus } from '@models/UserTournament';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getAuthSession(request);
    if (!session) return ApiResponse.unauthorized();

    const { id } = await params;
    const tournamentId = Number(id);
    if (isNaN(tournamentId) || tournamentId <= 0) return ApiResponse.badRequest('ID invalide');

    const body = await request.json();
    const { status } = body as { status: unknown };
    if (status !== 'ACTIVE' && status !== 'ARCHIVED') {
      return ApiResponse.badRequest('Statut invalide, valeurs acceptées : ACTIVE, ARCHIVED');
    }

    const link = await UserTournamentRepository.findByUserAndTournament(session.userId, tournamentId);
    if (!link) return ApiResponse.notFound('Tournoi non lié à votre compte');

    const updated = await UserTournamentRepository.updateStatus(session.userId, tournamentId, status as UserTournamentStatus);
    return ApiResponse.ok(updated);
  } catch (err) {
    return ApiResponse.serverError(err);
  }
}
