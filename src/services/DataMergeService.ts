import { TournamentPlayersDeckRepository } from '@/src/repositories/db/TournamentPlayersDeckRepository';
import { TournamentConflictRepository } from '@/src/repositories/db/TournamentConflictRepository';
import { UserTournamentRepository } from '@/src/repositories/db/UserTournamentRepository';
import { PlayerCommentRepository } from '@/src/repositories/db/PlayerCommentRepository';
import type { ConflictInput } from '@/src/repositories/db/TournamentConflictRepository';
import type { Deck } from '@/src/types/ink';

export interface CreatedConflict {
  _id: string;
  tournamentId: number;
  playerId: number;
  playerName: string;
  previousInks: string[][];
  proposedInks: string[][];
}

function hasInks(decks: string[][]): boolean {
  return decks.length > 0 && decks.some((d) => d.length > 0);
}

async function mergeUserDataIntoGroup(userId: string, groupId: string, tournamentId: number): Promise<CreatedConflict[]> {
  const [userDeck, groupDeck] = await Promise.all([
    TournamentPlayersDeckRepository.findByScope(tournamentId, { userId }),
    TournamentPlayersDeckRepository.findByScope(tournamentId, { groupId }),
  ]);

  if (!userDeck || userDeck.players.length === 0) return [];

  const groupPlayerMap = new Map(
    (groupDeck?.players ?? []).map((p) => [p.playerId, p]),
  );

  const toAssign: Array<{
    playerId: number;
    bestIdentifier: string;
    eventBestIdentifier: string;
    decks: Deck[];
  }> = [];
  const conflictInputs: ConflictInput[] = [];

  for (const userPlayer of userDeck.players) {
    if (!hasInks(userPlayer.decks)) continue;

    const groupPlayer = groupPlayerMap.get(userPlayer.playerId);

    if (!groupPlayer) {
      toAssign.push({
        playerId: userPlayer.playerId,
        bestIdentifier: userPlayer.best_identifier,
        eventBestIdentifier: userPlayer.event_best_identifier,
        decks: userPlayer.decks as Deck[],
      });
    } else if (!hasInks(groupPlayer.decks)) {
      toAssign.push({
        playerId: userPlayer.playerId,
        bestIdentifier: userPlayer.best_identifier,
        eventBestIdentifier: userPlayer.event_best_identifier,
        decks: userPlayer.decks as Deck[],
      });
    } else if (JSON.stringify(userPlayer.decks) !== JSON.stringify(groupPlayer.decks)) {
      conflictInputs.push({
        userId,
        groupId,
        tournamentId,
        playerId: userPlayer.playerId,
        playerName: userPlayer.best_identifier,
        previousInks: groupPlayer.decks,
        proposedInks: userPlayer.decks,
      });
    }
  }

  const [, createdConflicts] = await Promise.all([
    toAssign.length > 0
      ? TournamentPlayersDeckRepository.assignDecks(tournamentId, toAssign, { groupId })
      : Promise.resolve(null),
    conflictInputs.length > 0
      ? TournamentConflictRepository.createMany(conflictInputs)
      : Promise.resolve([]),
  ]);

  if (toAssign.length > 0) {
    await PlayerCommentRepository.migrateToGroup(
      tournamentId,
      toAssign.map((p) => p.playerId),
      userId,
      groupId,
    );
  }

  return (createdConflicts ?? []).map((c) => ({
    _id: String(c._id),
    tournamentId: c.tournamentId,
    playerId: c.playerId,
    playerName: c.playerName,
    previousInks: c.previousInks,
    proposedInks: c.proposedInks,
  }));
}

export const DataMergeService = {
  mergeUserDataIntoGroup,

  async hasPendingPersonalData(userId: string, groupId: string, tournamentId: number): Promise<boolean> {
    const userDeck = await TournamentPlayersDeckRepository.findByScope(tournamentId, { userId });
    if (!userDeck || userDeck.players.length === 0) return false;
    return userDeck.players.some((p) => hasInks(p.decks));
  },

  async mergeUserForTournament(userId: string, groupId: string, tournamentId: number): Promise<CreatedConflict[]> {
    const conflicts = await mergeUserDataIntoGroup(userId, groupId, tournamentId);
    await Promise.all([
      TournamentPlayersDeckRepository.deleteUserScope(tournamentId, userId),
      UserTournamentRepository.deleteByUserAndTournament(userId, tournamentId),
    ]);
    return conflicts;
  },
};
