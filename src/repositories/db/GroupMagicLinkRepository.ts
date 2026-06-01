import GroupMagicLinkModel from '@models/GroupMagicLink';
import connectToMongoDB from '@/src/lib/db';

export const GroupMagicLinkRepository = {
  async findByGroupAndTournament(groupId: string, tournamentId: number) {
    await connectToMongoDB();
    return GroupMagicLinkModel.findOne({ groupId, tournamentId, isActive: true }).lean();
  },

  async findByToken(token: string) {
    await connectToMongoDB();
    return GroupMagicLinkModel.findOne({ token, isActive: true }).lean();
  },

  async upsert(groupId: string, tournamentId: number, createdBy: string, token: string) {
    await connectToMongoDB();
    // Désactive l'ancien lien s'il existe, puis crée le nouveau
    await GroupMagicLinkModel.updateMany({ groupId, tournamentId }, { isActive: false });
    return GroupMagicLinkModel.create({ groupId, tournamentId, createdBy, token, isActive: true });
  },

  async deactivate(groupId: string, tournamentId: number) {
    await connectToMongoDB();
    return GroupMagicLinkModel.updateMany({ groupId, tournamentId }, { isActive: false });
  },
};
