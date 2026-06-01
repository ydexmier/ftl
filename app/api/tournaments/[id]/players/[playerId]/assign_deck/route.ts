import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { TournamentExternalAccessRepository } from '@/src/repositories/db/TournamentExternalAccessRepository';
import { RoundRepository } from '@/src/repositories/db/RoundRepository';
import { TournamentRegistrationRepository } from '@/src/repositories/db/TournamentRegistrationRepository';
import { TournamentPlayersDeckRepository } from '@/src/repositories/db/TournamentPlayersDeckRepository';
import { ScoutingReportRepository } from '@/src/repositories/db/ScoutingReportRepository';
import { PlayerCommentRepository } from '@/src/repositories/db/PlayerCommentRepository';
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
  const { decks, groupId, comment } = body as { decks: Deck[]; groupId?: string; comment?: string };

  let scope: { groupId?: string | null; userId?: string | null };
  let guestAccessId: string | null = null;
  let guestDisplayName: string | null = null;

  if (groupId) {
    const isMember = await GroupRepository.isMember(groupId, auth.userId);
    if (!isMember && auth.role !== 'ADMIN' && auth.role !== 'SUPERUSER') {
      const guestAccess = await TournamentExternalAccessRepository.findAcceptedForUser(auth.userId, tournamentId, groupId);
      if (!guestAccess) return ApiResponse.forbidden();
      guestAccessId = String(guestAccess._id);
      guestDisplayName = guestAccess.displayName ?? null;
    }
    scope = { groupId };
  } else {
    scope = { userId: auth.userId };
  }

  try {
    let playerInfo = await RoundRepository.findPlayerInTournament(tournamentId, playerId);

    if (!playerInfo) {
      const tournamentStarted = await RoundRepository.existsByTournamentId(tournamentId);
      if (!tournamentStarted) {
        const registration = await TournamentRegistrationRepository.findByTournamentId(tournamentId);
        const registered = registration?.players.find((p) => p.playerId === playerId);
        if (registered) {
          playerInfo = { id: registered.playerId, best_identifier: registered.realName, eventBestIdentifier: registered.name };
        }
      }
    }

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
          userId: guestAccessId ? null : auth.userId,
          guestAccessId,
          groupId: scope.groupId ?? null,
          tournamentId,
          playerId,
        },
      ]);

      const trimmedComment = comment?.trim();
      if (trimmedComment) {
        await PlayerCommentRepository.create({
          tournamentId,
          playerId,
          authorId: guestAccessId ? null : auth.userId,
          guestAccessId,
          guestDisplayName: guestDisplayName ?? undefined,
          groupId: scope.groupId ?? null,
          inks: decks[0] ?? [],
          content: trimmedComment,
        });
      }
    }

    return ApiResponse.ok({ players: modified });
  } catch (err) {
    return ApiResponse.serverError(err);
  }
}
