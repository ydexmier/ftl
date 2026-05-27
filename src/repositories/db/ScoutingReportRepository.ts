import mongoose from 'mongoose';
import ScoutingReportModel from '@models/ScoutingReport';
import connectToMongoDB from '@/src/lib/db';

export interface ScoutingReportInput {
  // Exactement l'un des deux doit être fourni — validé dans ScoutingService
  userId?: string | null;
  guestAccessId?: string | null;
  groupId: string | null;
  tournamentId: number;
  playerId: number | undefined;
}

export const ScoutingReportRepository = {
  async createMany(reports: ScoutingReportInput[]) {
    if (reports.length === 0) return;
    await connectToMongoDB();
    return ScoutingReportModel.insertMany(reports);
  },

  async countByGroupAndTournament(groupId: string, tournamentId: number) {
    await connectToMongoDB();
    return ScoutingReportModel.aggregate<{ userId: string; count: number }>([
      { $match: { groupId: new mongoose.Types.ObjectId(groupId), tournamentId, userId: { $ne: null } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $project: { _id: 0, userId: '$_id', count: 1 } },
    ]);
  },

  async deleteManyByGroupId(groupId: string) {
    await connectToMongoDB();
    return ScoutingReportModel.deleteMany({ groupId });
  },

  async countGlobalByUser(userId: string) {
    await connectToMongoDB();
    const results = await ScoutingReportModel.aggregate<{ tournamentId: number; count: number }>([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$tournamentId', count: { $sum: 1 } } },
      { $project: { _id: 0, tournamentId: '$_id', count: 1 } },
      { $sort: { count: -1 } },
    ]);

    const total = results.reduce((sum, r) => sum + r.count, 0);
    return { total, byTournament: results };
  },

  async deleteManyByGuestAccessId(guestAccessId: string) {
    await connectToMongoDB();
    return ScoutingReportModel.deleteMany({
      guestAccessId: new mongoose.Types.ObjectId(guestAccessId),
    });
  },
};
