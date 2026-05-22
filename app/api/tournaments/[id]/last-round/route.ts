import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { RoundRepository } from '@/src/repositories/db/RoundRepository';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession(req);
  if (!session) return ApiResponse.unauthorized();

  const { id } = await params;
  const tournamentId = Number(id);
  if (isNaN(tournamentId)) return ApiResponse.badRequest('ID de tournoi invalide');

  try {
    const roundId = await RoundRepository.findLastFetchedIdByTournament(tournamentId);
    return ApiResponse.ok({ roundId }, { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=30' });
  } catch (err) {
    return ApiResponse.serverError(err);
  }
}
