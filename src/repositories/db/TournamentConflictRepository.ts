import TournamentConflictModel from '@models/TournamentConflict';
import type { ITournamentConflict, ConflictStatus } from '@models/TournamentConflict';
import connectToMongoDB from '@/src/lib/db';

export interface ConflictInput {
  userId: string;
  groupId: string;
  tournamentId: number;
  playerId: number;
  playerName: string;
  previousInks: string[][];
  proposedInks: string[][];
}

export const TournamentConflictRepository = {
  async createMany(conflicts: ConflictInput[]) {
    await connectToMongoDB();
    return TournamentConflictModel.insertMany(
      conflicts.map((c) => ({ ...c, status: 'PENDING' })),
    );
  },

  async findPendingByUserAndTournament(userId: string, groupId: string, tournamentId: number) {
    await connectToMongoDB();
    return TournamentConflictModel.find({
      userId,
      groupId,
      tournamentId,
      status: { $in: ['PENDING', 'PENDING_ADMIN', 'UNCERTAINTY'] },
    }).lean();
  },

  async findPendingForUser(userId: string, tournamentId: number) {
    await connectToMongoDB();
    return TournamentConflictModel.find({ userId, tournamentId, status: 'PENDING' })
      .populate('groupId', 'name')
      .lean();
  },

  async findPendingAdminByGroupAndTournament(groupId: string, tournamentId: number) {
    await connectToMongoDB();
    return TournamentConflictModel.find({
      groupId,
      tournamentId,
      status: 'PENDING_ADMIN',
    })
      .populate('userId', 'username')
      .lean();
  },

  async findUncertaintyByGroupAndTournament(groupId: string, tournamentId: number) {
    await connectToMongoDB();
    return TournamentConflictModel.find({
      groupId,
      tournamentId,
      status: 'UNCERTAINTY',
    }).lean();
  },

  async countPendingAdminByGroup(groupId: string) {
    await connectToMongoDB();
    return TournamentConflictModel.countDocuments({ groupId, status: 'PENDING_ADMIN' });
  },

  async countUncertaintyByGroupAndTournament(groupId: string, tournamentId: number) {
    await connectToMongoDB();
    return TournamentConflictModel.countDocuments({ groupId, tournamentId, status: 'UNCERTAINTY' });
  },

  async updateStatus(
    conflictId: string,
    status: ConflictStatus,
    extra?: { resolvedInks?: string[][]; resolvedBy?: string },
  ) {
    await connectToMongoDB();
    return TournamentConflictModel.findByIdAndUpdate(
      conflictId,
      { status, ...extra },
      { new: true },
    ).lean();
  },

  async findById(conflictId: string): Promise<ITournamentConflict | null> {
    await connectToMongoDB();
    return TournamentConflictModel.findById(conflictId).lean() as Promise<ITournamentConflict | null>;
  },
};
