import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { TournamentPlayersDeckRepository } from '@/src/repositories/db/TournamentPlayersDeckRepository';
import { RoundRepository } from '@/src/repositories/db/RoundRepository';
import { TournamentRegistrationRepository } from '@/src/repositories/db/TournamentRegistrationRepository';
import { PlayerCommentRepository } from '@/src/repositories/db/PlayerCommentRepository';
import { RegistrationService } from '@/src/services/RegistrationService';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthSession(req);
  if (!auth) return ApiResponse.unauthorized();

  const { id } = await params;
  const tournamentId = Number(id);
  if (isNaN(tournamentId)) return ApiResponse.badRequest('ID de tournoi invalide');

  const url = new URL(req.url);
  const groupId = url.searchParams.get('groupId');
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
  const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get('perPage') ?? '25')));
  const search = url.searchParams.get('search') ?? '';
  const sortParam = url.searchParams.get('sort');
  const sortOrder: 'asc' | 'desc' = sortParam === 'desc' ? 'desc' : 'asc';

  let scope: { groupId?: string | null; userId?: string | null };
  if (groupId) {
    const isMember = await GroupRepository.isMember(groupId, auth.userId);
    if (!isMember && auth.role !== 'ADMIN' && auth.role !== 'SUPERUSER') {
      return ApiResponse.forbidden();
    }
    scope = { groupId };
  } else {
    scope = { userId: auth.userId };
    // Lazy init for personal scope: populate from rounds, or from registrations pre-tournament
    const existing = await TournamentPlayersDeckRepository.findByScope(tournamentId, scope);
    if (!existing || existing.players.length === 0) {
      const roundPlayers = await RoundRepository.findUniquePlayersByTournamentId(tournamentId);
      if (roundPlayers.length > 0) {
        await TournamentPlayersDeckRepository.upsertMissingPlayers(tournamentId, roundPlayers, scope);
        await TournamentPlayersDeckRepository.syncPlayerIdentifiers(tournamentId, roundPlayers);
      } else {
        const registration = await TournamentRegistrationRepository.findByTournamentId(tournamentId);
        if (registration && registration.players.length > 0) {
          await TournamentPlayersDeckRepository.upsertMissingPlayers(
            tournamentId,
            registration.players.map(RegistrationService.toPlayerInfo),
            scope,
          );
        }
      }
    }
  }

  try {
    const result = await TournamentPlayersDeckRepository.findPlayersPaginated(tournamentId, scope, {
      search,
      page,
      perPage,
      sortOrder,
    });

    const totalPages = Math.max(1, Math.ceil(result.total / perPage));
    const playerIds = result.players.map((p) => p.playerId);
    const commentCounts = playerIds.length > 0
      ? await PlayerCommentRepository.countByPlayers(tournamentId, playerIds, scope)
      : {};

    return ApiResponse.ok({
      players: result.players,
      pagination: { page, perPage, total: result.total, totalPages },
      commentCounts,
    });
  } catch (err) {
    return ApiResponse.serverError(err);
  }
}
