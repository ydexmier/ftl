import GroupTournamentModel from '@models/GroupTournament';
import connectToMongoDB from '@/src/lib/db';

export const GroupTournamentRepository = {
  async findByGroupId(groupId: string) {
    await connectToMongoDB();
    return GroupTournamentModel.find({ groupId }).lean();
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
    return GroupTournamentModel.create({ groupId, tournamentId, addedBy });
  },

  async remove(groupId: string, tournamentId: number) {
    await connectToMongoDB();
    return GroupTournamentModel.findOneAndDelete({ groupId, tournamentId });
  },

  async hasAccess(groupId: string, tournamentId: number): Promise<boolean> {
    await connectToMongoDB();
    const count = await GroupTournamentModel.countDocuments({ groupId, tournamentId });
    return count > 0;
  },
};
