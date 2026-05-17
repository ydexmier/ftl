import AccessRequestModel from '@models/AccessRequest';
import connectToMongoDB from '@/src/lib/db';

export const AccessRequestRepository = {
  async create(email: string, reason?: string) {
    await connectToMongoDB();
    return AccessRequestModel.create({ email, reason: reason || undefined });
  },

  async findPendingByEmail(email: string): Promise<boolean> {
    await connectToMongoDB();
    return (await AccessRequestModel.exists({ email, status: 'PENDING' })) !== null;
  },

  async findById(id: string) {
    await connectToMongoDB();
    return AccessRequestModel.findById(id).lean();
  },

  async findWithFilters(status: string, page: number, limit: number) {
    await connectToMongoDB();
    const query: Record<string, unknown> = {};
    if (status) query.status = status;

    const [requests, total] = await Promise.all([
      AccessRequestModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AccessRequestModel.countDocuments(query),
    ]);

    return { requests, total };
  },

  async countPending(): Promise<number> {
    await connectToMongoDB();
    return AccessRequestModel.countDocuments({ status: 'PENDING' });
  },

  async approve(id: string, reviewedBy: string) {
    await connectToMongoDB();
    return AccessRequestModel.findByIdAndUpdate(
      id,
      { status: 'APPROVED', reviewedBy, reviewedAt: new Date() },
      { new: true },
    ).lean();
  },

  async reject(id: string, reviewedBy: string) {
    await connectToMongoDB();
    return AccessRequestModel.findByIdAndUpdate(
      id,
      { status: 'REJECTED', reviewedBy, reviewedAt: new Date() },
      { new: true },
    ).lean();
  },
};
