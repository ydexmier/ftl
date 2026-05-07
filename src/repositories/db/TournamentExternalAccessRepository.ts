import TournamentExternalAccessModel from '@models/TournamentExternalAccess';
import connectToMongoDB from '@/src/lib/db';
import type { TournamentExternalAccessStatus } from '@/src/types/group';

const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours par défaut

export const TournamentExternalAccessRepository = {
  async findById(id: string) {
    await connectToMongoDB();
    return TournamentExternalAccessModel.findById(id).lean();
  },

  async findByGroupAndTournament(groupId: string, tournamentId: number) {
    await connectToMongoDB();
    return TournamentExternalAccessModel.find({ groupId, tournamentId }).lean();
  },

  async findActiveByUserAndTournament(userId: string, tournamentId: number) {
    await connectToMongoDB();
    return TournamentExternalAccessModel.findOne({
      userId,
      tournamentId,
      status: 'ACCEPTED',
      expiresAt: { $gt: new Date() },
    }).lean();
  },

  async findPendingByUser(userId: string) {
    await connectToMongoDB();
    return TournamentExternalAccessModel.find({
      userId,
      status: 'PENDING',
      expiresAt: { $gt: new Date() },
    }).lean();
  },

  async create(data: {
    groupId: string;
    tournamentId: number;
    userId: string;
    invitedBy: string;
    expiresAt?: Date;
  }) {
    await connectToMongoDB();
    return TournamentExternalAccessModel.create({
      ...data,
      status: 'PENDING' as TournamentExternalAccessStatus,
      expiresAt: data.expiresAt ?? new Date(Date.now() + DEFAULT_TTL_MS),
    });
  },

  async updateStatus(id: string, status: TournamentExternalAccessStatus) {
    await connectToMongoDB();
    return TournamentExternalAccessModel.findByIdAndUpdate(id, { status }, { new: true }).lean();
  },

  async hasActiveAccess(userId: string, groupId: string, tournamentId: number): Promise<boolean> {
    await connectToMongoDB();
    const count = await TournamentExternalAccessModel.countDocuments({
      userId,
      groupId,
      tournamentId,
      status: 'ACCEPTED',
      expiresAt: { $gt: new Date() },
    });
    return count > 0;
  },

  async expireOldAccess() {
    await connectToMongoDB();
    return TournamentExternalAccessModel.updateMany(
      { status: 'ACCEPTED', expiresAt: { $lte: new Date() } },
      { status: 'EXPIRED' },
    );
  },
};
