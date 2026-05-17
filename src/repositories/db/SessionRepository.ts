import SessionModel from '@models/Session';
import connectToMongoDB from '@/src/lib/db';

export const SessionRepository = {
  async countActive(userId: string): Promise<number> {
    await connectToMongoDB();
    return SessionModel.countDocuments({ userId, expiresAt: { $gt: new Date() } });
  },

  async findByUserId(userId: string) {
    await connectToMongoDB();
    return SessionModel.find({ userId }).sort({ lastActivityAt: -1 }).lean();
  },

  async deleteByUserId(userId: string) {
    await connectToMongoDB();
    return SessionModel.deleteMany({ userId });
  },
};
