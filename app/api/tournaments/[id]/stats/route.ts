import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { TournamentPlayersDeckRepository } from '@/src/repositories/db/TournamentPlayersDeckRepository';
import { RoundRepository } from '@/src/repositories/db/RoundRepository';
import type { ITournamentPlayersDeck } from '@models/TournamentPlayersDeck';

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
    const [scoutingStats, allPlayers, allMatches] = await Promise.all([
      TournamentPlayersDeckRepository.getDetailedScoutingStats(tournamentId, scope),
      TournamentPlayersDeckRepository.findByScope(tournamentId, scope),
      RoundRepository.findAllMatchesByTournamentId(tournamentId),
    ]);

    // Build deck lookup: playerId → "Ink1/Ink2" (sorted) for fully scouted players only
    const fullyScoutedMap = new Map<number, string>();
    for (const player of (allPlayers as ITournamentPlayersDeck | null)?.players ?? []) {
      const decks = player.decks as string[][];
      if (decks.length === 1 && decks[0].length === 2) {
        fullyScoutedMap.set(player.playerId, [...decks[0]].sort().join('/'));
      }
    }

    // Compute matchup matrix across all rounds
    type Matchup = { winsA: number; winsB: number };
    const matchups = new Map<string, Matchup>();

    for (const match of allMatches) {
      const pmrs = match.player_match_relationships;
      if (match.match_is_bye || pmrs.length < 2) continue;

      const dk1 = fullyScoutedMap.get(pmrs[0].player.id);
      const dk2 = fullyScoutedMap.get(pmrs[1].player.id);
      if (!dk1 || !dk2) continue;

      // Skip draws and unresolved matches — no game data to count
      if (match.match_is_intentional_draw || match.match_is_unintentional_draw) continue;
      const winnerId = typeof match.winning_player === 'number' ? match.winning_player : null;
      if (winnerId === null) continue;

      const gamesWon = match.games_won_by_winner ?? 0;
      const gamesLost = match.games_won_by_loser ?? 0;
      if (gamesWon === 0 && gamesLost === 0) continue;

      // Canonical key: alphabetical order ensures symmetric matrix lookup
      const [canonA, canonB] = dk1 <= dk2 ? [dk1, dk2] : [dk2, dk1];
      const mapKey = `${canonA}|${canonB}`;
      if (!matchups.has(mapKey)) matchups.set(mapKey, { winsA: 0, winsB: 0 });
      const m = matchups.get(mapKey)!;

      if (winnerId === pmrs[0].player.id) {
        if (dk1 === canonA) { m.winsA += gamesWon; m.winsB += gamesLost; }
        else { m.winsB += gamesWon; m.winsA += gamesLost; }
      } else if (winnerId === pmrs[1].player.id) {
        if (dk2 === canonA) { m.winsA += gamesWon; m.winsB += gamesLost; }
        else { m.winsB += gamesWon; m.winsA += gamesLost; }
      }
    }

    const entries = Array.from(matchups.entries()).map(([key, value]) => {
      const [deckA, deckB] = key.split('|');
      return { deckA, deckB, ...value };
    });

    const deckSet = new Set<string>();
    entries.forEach(({ deckA, deckB }) => { deckSet.add(deckA); deckSet.add(deckB); });

    return ApiResponse.ok({
      scoutingProgress: {
        total: scoutingStats.total,
        fullyScouted: scoutingStats.fullyScouted,
        partiallyScouted: scoutingStats.partiallyScouted,
        unscouted: scoutingStats.unscouted,
      },
      inkDistribution: scoutingStats.inkDistribution,
      matchupMatrix: {
        decks: Array.from(deckSet).sort(),
        entries,
      },
    });
  } catch (err) {
    return ApiResponse.serverError(err);
  }
}
