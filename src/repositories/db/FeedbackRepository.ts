import FeedbackModel from '@models/Feedback';
import type { FeedbackStatus, FeedbackType } from '@models/Feedback';
import connectToMongoDB from '@/src/lib/db';

export const FeedbackRepository = {
  async create(data: {
    type: FeedbackType;
    title: string;
    description: string;
    page: string;
    userId?: string;
    username?: string;
  }) {
    await connectToMongoDB();
    return FeedbackModel.create(data);
  },

  async findWithFilters(page: number, limit: number, status?: FeedbackStatus) {
    await connectToMongoDB();
    const query = status ? { status } : {};
    const [feedbacks, total] = await Promise.all([
      FeedbackModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      FeedbackModel.countDocuments(query),
    ]);
    return { feedbacks, total };
  },

  async updateStatus(id: string, status: FeedbackStatus) {
    await connectToMongoDB();
    return FeedbackModel.findByIdAndUpdate(id, { status }, { new: true }).lean();
  },
};
