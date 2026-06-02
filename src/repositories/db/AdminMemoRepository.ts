import AdminMemoModel from '@models/AdminMemo';
import connectToMongoDB from '@/src/lib/db';

export const AdminMemoRepository = {
  async findByAdminId(adminId: string) {
    await connectToMongoDB();
    return AdminMemoModel.find({ adminId }).lean();
  },

  async findByAdminAndUser(adminId: string, targetUserId: string) {
    await connectToMongoDB();
    return AdminMemoModel.findOne({ adminId, targetUserId }).lean();
  },

  async upsert(adminId: string, targetUserId: string, content: string) {
    await connectToMongoDB();
    return AdminMemoModel.findOneAndUpdate(
      { adminId, targetUserId },
      { content },
      { upsert: true, new: true },
    ).lean();
  },

  async delete(adminId: string, targetUserId: string) {
    await connectToMongoDB();
    return AdminMemoModel.findOneAndDelete({ adminId, targetUserId });
  },
};
