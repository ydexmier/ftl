import { NextRequest } from 'next/server';
import { getAdminSession } from '@/src/lib/auth/getAdminSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { ScoutingReportRepository } from '@/src/repositories/db/ScoutingReportRepository';
import { TournamentRepository } from '@/src/repositories/db/TournamentRepository';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAdminSession(req);
  if (!auth) return ApiResponse.unauthorized();

  const { id: userId } = await params;

  try {
    const { total, byTournament } = await ScoutingReportRepository.countGlobalByUser(userId);

    const tournamentIds = byTournament.map((t) => t.tournamentId);
    const tournaments = await Promise.all(tournamentIds.map((tid) => TournamentRepository.findById(tid)));
    const tournamentMap = Object.fromEntries(
      tournaments.filter(Boolean).map((t) => [t!.id, t!.name]),
    );

    return ApiResponse.ok({
      total,
      byTournament: byTournament.map((t) => ({
        tournamentId: t.tournamentId,
        tournamentName: tournamentMap[t.tournamentId] ?? `Tournoi #${t.tournamentId}`,
        count: t.count,
      })),
    });
  } catch (err) {
    return ApiResponse.serverError(err);
  }
}
