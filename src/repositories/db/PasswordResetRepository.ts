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
};
