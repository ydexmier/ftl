import PasswordResetModel from '@models/PasswordReset';
import connectToMongoDB from '@/src/lib/db';

export const PasswordResetRepository = {
  async findByToken(token: string) {
    await connectToMongoDB();
    return PasswordResetModel.findOne({ token }).lean();
  },

  async markUsed(token: string) {
    await connectToMongoDB();
    return PasswordResetModel.findOneAndUpdate({ token }, { usedAt: new Date() });
  },

  async create(data: { userId: string; token: string; expiresAt: Date }) {
    await connectToMongoDB();
    return PasswordResetModel.create(data);
  },

  async invalidateForUser(userId: string) {
    await connectToMongoDB();
    return PasswordResetModel.deleteMany({ userId });
  },

  async deleteByToken(token: string) {
    await connectToMongoDB();
    return PasswordResetModel.deleteOne({ token });
  },
};
