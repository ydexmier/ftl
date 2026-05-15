import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { RoundRepository } from '@/src/repositories/db/RoundRepository';
import { TournamentPlayersDeckRepository } from '@/src/repositories/db/TournamentPlayersDeckRepository';
import { ScoutingReportRepository } from '@/src/repositories/db/ScoutingReportRepository';
import type { Deck } from '@/src/types/ink';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> },
) {
  const auth = await getAuthSession(req);
  if (!auth) return ApiResponse.unauthorized();

  const { id, playerId: playerIdStr } = await params;
  const tournamentId = Number(id);
  const playerId = Number(playerIdStr);
  if (isNaN(tournamentId) || isNaN(playerId)) return ApiResponse.badRequest('Paramètres invalides');

  const body = await req.json();
  const { decks, groupId } = body as { decks: Deck[]; groupId?: string };

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
    const playerInfo = await RoundRepository.findPlayerInTournament(tournamentId, playerId);
    if (!playerInfo) return ApiResponse.notFound('Joueur introuvable dans les rondes de ce tournoi');

    const modified = await TournamentPlayersDeckRepository.assignDecks(
      tournamentId,
      [
        {
          playerId,
          bestIdentifier: playerInfo.best_identifier,
          eventBestIdentifier: playerInfo.eventBestIdentifier,
          decks: decks ?? [],
        },
      ],
      scope,
    );

    if (decks && decks.length > 0) {
      await ScoutingReportRepository.createMany([
        {
          userId: auth.userId,
          groupId: scope.groupId ?? null,
          tournamentId,
          playerId,
        },
      ]);
    }

    return ApiResponse.ok({ players: modified });
  } catch (err) {
    return ApiResponse.serverError(err);
  }
}
