import { TournamentConflictRepository } from '@/src/repositories/db/TournamentConflictRepository';
import { TournamentPlayersDeckRepository } from '@/src/repositories/db/TournamentPlayersDeckRepository';
import { PlayerCommentRepository } from '@/src/repositories/db/PlayerCommentRepository';
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

  async dismissUncertainty(conflictId: string, groupId: string) {
    const conflict = await TournamentConflictRepository.findById(conflictId);
    if (!conflict) throw new Error('NOT_FOUND');
    if (String(conflict.groupId) !== groupId) throw new Error('FORBIDDEN');
    if (conflict.status !== 'UNCERTAINTY') throw new Error('Ce conflit n\'est pas une incertitude');
    return TournamentConflictRepository.deleteById(conflictId);
  },

  async resolveAdminConflict(
    conflictId: string,
    adminId: string,
    decision: 'APPROVED' | 'REJECTED',
  ) {
    const conflict = await TournamentConflictRepository.findById(conflictId);
    if (!conflict) throw new Error('NOT_FOUND');
    if (conflict.status !== 'PENDING_ADMIN') throw new Error('Ce conflit ne peut plus être modifié');

    const groupId = String(conflict.groupId);
    const userId = String(conflict.userId);

    if (decision === 'APPROVED') {
      await TournamentPlayersDeckRepository.assignDecks(
        conflict.tournamentId,
        [{
          playerId: conflict.playerId,
          bestIdentifier: conflict.playerName,
          eventBestIdentifier: '',
          decks: conflict.proposedInks as Deck[],
        }],
        { groupId },
      );
      // Inks du membre acceptés : supprimer les anciens commentaires groupe, migrer les commentaires perso
      await PlayerCommentRepository.deleteForPlayerAndGroup(
        conflict.tournamentId,
        conflict.playerId,
        groupId,
      );
      await PlayerCommentRepository.migrateToGroup(
        conflict.tournamentId,
        [conflict.playerId],
        userId,
        groupId,
      );
    } else {
      // Inks du groupe maintenus : supprimer les commentaires perso du membre
      await PlayerCommentRepository.deleteForPlayerAndUser(
        conflict.tournamentId,
        conflict.playerId,
        userId,
      );
    }

    return TournamentConflictRepository.updateStatus(conflictId, decision, { resolvedBy: adminId });
  },
};
