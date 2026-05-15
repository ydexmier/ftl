import GroupTournamentModel from '@models/GroupTournament';
import type { GroupTournamentStatus } from '@models/GroupTournament';
import connectToMongoDB from '@/src/lib/db';

export const GroupTournamentRepository = {
  async findByGroupId(groupId: string, status?: GroupTournamentStatus) {
    await connectToMongoDB();
    const filter: Record<string, unknown> = { groupId };
    if (status) filter.status = status;
    return GroupTournamentModel.find(filter).lean();
  },

  async findByGroupAndTournament(groupId: string, tournamentId: number) {
    await connectToMongoDB();
    return GroupTournamentModel.findOne({ groupId, tournamentId }).lean();
  },

  async findGroupsByTournamentId(tournamentId: number) {
    await connectToMongoDB();
    return GroupTournamentModel.find({ tournamentId }).lean();
  },

  async add(groupId: string, tournamentId: number, addedBy: string) {
    await connectToMongoDB();
    return GroupTournamentModel.create({ groupId, tournamentId, addedBy, status: 'ACTIVE' });
  },

  async remove(groupId: string, tournamentId: number) {
    await connectToMongoDB();
    return GroupTournamentModel.findOneAndDelete({ groupId, tournamentId });
  },

  async updateStatus(groupId: string, tournamentId: number, status: GroupTournamentStatus) {
    await connectToMongoDB();
    return GroupTournamentModel.findOneAndUpdate(
      { groupId, tournamentId },
      { status },
      { new: true },
    ).lean();
  },

  async hasAccess(groupId: string, tournamentId: number): Promise<boolean> {
    await connectToMongoDB();
    const count = await GroupTournamentModel.countDocuments({ groupId, tournamentId });
    return count > 0;
  },
};
