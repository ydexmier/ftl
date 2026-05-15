import { TournamentConflictRepository } from '@/src/repositories/db/TournamentConflictRepository';
import { TournamentPlayersDeckRepository } from '@/src/repositories/db/TournamentPlayersDeckRepository';
import type { Deck } from '@/src/types/ink';

export const ConflictService = {
  async getUserPendingConflicts(userId: string, tournamentId: number) {
    return TournamentConflictRepository.findPendingForUser(userId, tournamentId);
  },

  async getGroupPendingAdminConflicts(groupId: string) {
    return TournamentConflictRepository.findAllPendingAdminByGroup(groupId);
  },

  async getGroupUncertainties(groupId: string) {
    return TournamentConflictRepository.findAllUncertaintyByGroup(groupId);
  },

  async resolveMemberConflict(
    conflictId: string,
    userId: string,
    status: 'PENDING_ADMIN' | 'UNCERTAINTY',
  ) {
    const conflict = await TournamentConflictRepository.findById(conflictId);
    if (!conflict) throw new Error('NOT_FOUND');
    if (String(conflict.userId) !== userId) throw new Error('FORBIDDEN');
    if (conflict.status !== 'PENDING') throw new Error('Ce conflit ne peut plus être modifié');

    return TournamentConflictRepository.updateStatus(conflictId, status);
  },

  async resolveAdminConflict(
    conflictId: string,
    adminId: string,
    decision: 'APPROVED' | 'REJECTED',
  ) {
    const conflict = await TournamentConflictRepository.findById(conflictId);
    if (!conflict) throw new Error('NOT_FOUND');
    if (conflict.status !== 'PENDING_ADMIN') throw new Error('Ce conflit ne peut plus être modifié');

    if (decision === 'APPROVED') {
      await TournamentPlayersDeckRepository.assignDecks(
        conflict.tournamentId,
        [{
          playerId: conflict.playerId,
          bestIdentifier: conflict.playerName,
          eventBestIdentifier: '',
          decks: conflict.proposedInks as Deck[],
        }],
        { groupId: String(conflict.groupId) },
      );
    }

    return TournamentConflictRepository.updateStatus(conflictId, decision, { resolvedBy: adminId });
  },
};
