import UserTournamentModel from '@models/UserTournament';
import type { UserTournamentStatus } from '@models/UserTournament';
import connectToMongoDB from '@/src/lib/db';

export const UserTournamentRepository = {
  async findByUserId(userId: string, status?: UserTournamentStatus) {
    await connectToMongoDB();
    const filter: Record<string, unknown> = { userId };
    if (status) filter.status = status;
    return UserTournamentModel.find(filter).lean();
  },

  async findByUserAndTournament(userId: string, tournamentId: number) {
    await connectToMongoDB();
    return UserTournamentModel.findOne({ userId, tournamentId }).lean();
  },

  async create(userId: string, tournamentId: number) {
    await connectToMongoDB();
    return UserTournamentModel.create({ userId, tournamentId, status: 'ACTIVE' });
  },

  async updateStatus(userId: string, tournamentId: number, status: UserTournamentStatus) {
    await connectToMongoDB();
    return UserTournamentModel.findOneAndUpdate(
      { userId, tournamentId },
      { status },
      { new: true },
    ).lean();
  },

  async exists(userId: string, tournamentId: number): Promise<boolean> {
    await connectToMongoDB();
    const count = await UserTournamentModel.countDocuments({ userId, tournamentId });
    return count > 0;
  },

  async deleteByUserId(userId: string) {
    await connectToMongoDB();
    return UserTournamentModel.deleteMany({ userId });
  },
};
