import InvitationModel from '@models/Invitation';
import connectToMongoDB from '@/src/lib/db';

export const InvitationRepository = {
  async findWithFilters(status: string, page: number, limit: number) {
    await connectToMongoDB();
    const query: Record<string, unknown> = {};
    if (status) query.status = status;

    const [invitations, total] = await Promise.all([
      InvitationModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('invitedBy', 'username')
        .populate('groupIds', 'name')
        .lean(),
      InvitationModel.countDocuments(query),
    ]);

    return { invitations, total };
  },

  async findById(id: string) {
    await connectToMongoDB();
    return InvitationModel.findById(id).lean();
  },

  async findByToken(token: string) {
    await connectToMongoDB();
    return InvitationModel.findOne({ token }).lean();
  },

  async findByTokenWithGroups(token: string) {
    await connectToMongoDB();
    return InvitationModel.findOne({ token }).populate('groupIds', 'name').lean();
  },

  async findPendingByEmail(email: string): Promise<boolean> {
    await connectToMongoDB();
    return (await InvitationModel.countDocuments({ email, status: 'PENDING' })) > 0;
  },

  async create(data: {
    email: string;
    token: string;
    groupIds: string[];
    invitedBy: string;
    expiresAt: Date;
  }) {
    await connectToMongoDB();
    return InvitationModel.create(data);
  },

  async cancel(id: string) {
    await connectToMongoDB();
    return InvitationModel.findByIdAndUpdate(id, { status: 'CANCELLED' });
  },

  async renewToken(id: string, token: string, expiresAt: Date) {
    await connectToMongoDB();
    return InvitationModel.findByIdAndUpdate(id, { token, expiresAt });
  },

  async markExpired(id: string) {
    await connectToMongoDB();
    return InvitationModel.findByIdAndUpdate(id, { status: 'EXPIRED' });
  },

  async markUsed(id: string) {
    await connectToMongoDB();
    return InvitationModel.findByIdAndUpdate(id, { status: 'USED', usedAt: new Date() });
  },
};
