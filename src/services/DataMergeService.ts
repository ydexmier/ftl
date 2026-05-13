import { TournamentPlayersDeckRepository } from '@/src/repositories/db/TournamentPlayersDeckRepository';
import { TournamentConflictRepository } from '@/src/repositories/db/TournamentConflictRepository';
import { GroupTournamentRepository } from '@/src/repositories/db/GroupTournamentRepository';
import type { ConflictInput } from '@/src/repositories/db/TournamentConflictRepository';
import type { Deck } from '@/src/types/ink';

function hasInks(decks: string[][]): boolean {
  return decks.length > 0 && decks.some((d) => d.length > 0);
}

export const DataMergeService = {
  async mergeUserDataIntoGroup(userId: string, groupId: string, tournamentId: number): Promise<void> {
    const [userDeck, groupDeck] = await Promise.all([
      TournamentPlayersDeckRepository.findByScope(tournamentId, { userId }),
      TournamentPlayersDeckRepository.findByScope(tournamentId, { groupId }),
    ]);

    if (!userDeck || userDeck.players.length === 0) return;

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
          eventBestIdentifier: userPlayer.game_user_profile_picture_url,
          decks: userPlayer.decks as Deck[],
        });
      } else if (!hasInks(groupPlayer.decks)) {
        toAssign.push({
          playerId: userPlayer.playerId,
          bestIdentifier: userPlayer.best_identifier,
          eventBestIdentifier: userPlayer.game_user_profile_picture_url,
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

    await Promise.all([
      toAssign.length > 0
        ? TournamentPlayersDeckRepository.assignDecks(tournamentId, toAssign, { groupId })
        : Promise.resolve(),
      conflictInputs.length > 0
        ? TournamentConflictRepository.createMany(conflictInputs)
        : Promise.resolve(),
    ]);
  },

  async mergeOnGroupJoin(userId: string, groupId: string): Promise<void> {
    const groupTournaments = await GroupTournamentRepository.findByGroupId(groupId, 'ACTIVE');
    await Promise.all(
      groupTournaments.map((gt) =>
        DataMergeService.mergeUserDataIntoGroup(userId, groupId, gt.tournamentId),
      ),
    );
  },
};
