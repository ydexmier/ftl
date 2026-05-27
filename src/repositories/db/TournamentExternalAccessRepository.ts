import TournamentExternalAccessModel from '@models/TournamentExternalAccess';
import connectToMongoDB from '@/src/lib/db';
import type { TournamentExternalAccessStatus } from '@/src/types/group';

const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours par défaut

export const TournamentExternalAccessRepository = {
  async findById(id: string) {
    await connectToMongoDB();
    return TournamentExternalAccessModel.findById(id).lean();
  },

  async findByAccessToken(token: string) {
    await connectToMongoDB();
    return TournamentExternalAccessModel.findOne({ accessToken: token }).lean();
  },

  async findByGroupAndTournament(groupId: string, tournamentId: number) {
    await connectToMongoDB();
    return TournamentExternalAccessModel.find({ groupId, tournamentId })
      .sort({ createdAt: -1 })
      .lean();
  },

  async findActiveByEmail(email: string, tournamentId: number) {
    await connectToMongoDB();
    return TournamentExternalAccessModel.findOne({
      email: email.toLowerCase(),
      tournamentId,
      status: 'ACCEPTED',
      expiresAt: { $gt: new Date() },
    }).lean();
  },

  async create(data: {
    groupId: string;
    tournamentId: number;
    invitedBy: string;
    email: string;
    accessToken: string;
    expiresAt?: Date;
  }) {
    await connectToMongoDB();
    return TournamentExternalAccessModel.create({
      ...data,
      email: data.email.toLowerCase(),
      status: 'PENDING' as TournamentExternalAccessStatus,
      expiresAt: data.expiresAt ?? new Date(Date.now() + DEFAULT_TTL_MS),
    });
  },

  async setDisplayName(id: string, displayName: string) {
    await connectToMongoDB();
    return TournamentExternalAccessModel.findByIdAndUpdate(
      id,
      { displayName, status: 'ACCEPTED' },
      { new: true },
    ).lean();
  },

  async updateStatus(id: string, status: TournamentExternalAccessStatus) {
    await connectToMongoDB();
    return TournamentExternalAccessModel.findByIdAndUpdate(id, { status }, { new: true }).lean();
  },

  async revokeAccess(id: string) {
    await connectToMongoDB();
    return TournamentExternalAccessModel.findByIdAndUpdate(
      id,
      { status: 'REVOKED' },
      { new: true },
    ).lean();
  },

  async hasActiveAccessByEmail(email: string, groupId: string, tournamentId: number): Promise<boolean> {
    await connectToMongoDB();
    return (await TournamentExternalAccessModel.exists({
      email: email.toLowerCase(),
      groupId,
      tournamentId,
      status: { $in: ['PENDING', 'ACCEPTED'] },
      expiresAt: { $gt: new Date() },
    })) !== null;
  },

  async expireOldAccess() {
    await connectToMongoDB();
    return TournamentExternalAccessModel.updateMany(
      { status: 'ACCEPTED', expiresAt: { $lte: new Date() } },
      { status: 'EXPIRED' },
    );
  },
};
