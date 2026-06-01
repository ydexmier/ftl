import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { TournamentExternalAccessRepository } from '@/src/repositories/db/TournamentExternalAccessRepository';
import { RoundRepository } from '@/src/repositories/db/RoundRepository';
import { TournamentPlayersDeckRepository } from '@/src/repositories/db/TournamentPlayersDeckRepository';
import type { PlayerHistoryEntry, PlayerHistoryResult } from '@/src/types/player';
import type { Match } from '@/src/types/match';

function buildResult(match: Match, playerId: number): PlayerHistoryResult {
  if (match.match_is_bye || match.match_is_loss) return 'BYE';
  if (match.match_is_intentional_draw || match.match_is_unintentional_draw || match.games_drawn) return 'DRAW';
  if (match.winning_player === null) return 'PENDING';
  return match.winning_player === playerId ? 'WIN' : 'LOSS';
}

function buildScores(
  match: Match,
  playerId: number,
): { gamesWon: number | null; gamesLost: number | null } {
  if (match.winning_player === null) return { gamesWon: null, gamesLost: null };
  if (match.winning_player === playerId) {
    return { gamesWon: match.games_won_by_winner, gamesLost: match.games_won_by_loser };
  }
  return { gamesWon: match.games_won_by_loser, gamesLost: match.games_won_by_winner };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> },
) {
  const auth = await getAuthSession(req);
  if (!auth) return ApiResponse.unauthorized();

  const { id, playerId: playerIdStr } = await params;
  const tournamentId = Number(id);
  const playerId = Number(playerIdStr);
  if (isNaN(tournamentId) || isNaN(playerId)) return ApiResponse.badRequest('Paramètres invalides');

  const url = new URL(req.url);
  const groupId = url.searchParams.get('groupId');

  let scope: { groupId?: string | null; userId?: string | null };
  if (groupId) {
    const isMember = await GroupRepository.isMember(groupId, auth.userId);
    if (!isMember && auth.role !== 'ADMIN' && auth.role !== 'SUPERUSER') {
      const guestAccess = await TournamentExternalAccessRepository.findAcceptedForUser(
        auth.userId,
        tournamentId,
        groupId,
      );
      if (!guestAccess) return ApiResponse.forbidden();
    }
    scope = { groupId };
  } else {
    scope = { userId: auth.userId };
  }

  const [rounds, decksData] = await Promise.all([
    RoundRepository.findRoundsByTournamentId(tournamentId),
    TournamentPlayersDeckRepository.findByScope(tournamentId, scope),
  ]);

  const playerDecksMap = new Map<number, string[][]>();
  if (decksData?.players) {
    for (const p of decksData.players) {
      playerDecksMap.set(p.playerId, p.decks);
    }
  }

  const history: PlayerHistoryEntry[] = [];

  for (let i = 0; i < rounds.length; i++) {
    const round = rounds[i];
    const match = round.results?.find((m) =>
      m.player_match_relationships.some((pmr) => pmr.player?.id === playerId),
    );
    if (!match) continue;

    const opponentPmr = match.player_match_relationships.find(
      (pmr) => pmr.player?.id !== playerId,
    );
    const opponentId = opponentPmr?.player?.id ?? null;
    const opponentName = opponentPmr?.player?.best_identifier ?? null;

    const result = buildResult(match, playerId);
    const { gamesWon, gamesLost } = buildScores(match, playerId);

    history.push({
      roundId: round.id,
      roundNumber: i + 1,
      opponentId,
      opponentName,
      opponentDecks: opponentId ? (playerDecksMap.get(opponentId) ?? []) : [],
      result,
      gamesWon,
      gamesLost,
    });
  }

  return ApiResponse.ok({ history });
}
