import UserModel from '@models/User';
import connectToMongoDB from '@/src/lib/db';

export const UserRepository = {
  async findWithFilters(search: string, role: string, page: number, limit: number) {
    await connectToMongoDB();
    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;

    const [users, total] = await Promise.all([
      UserModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-passwordHash')
        .lean(),
      UserModel.countDocuments(query),
    ]);

    return { users, total };
  },

  async findById(id: string) {
    await connectToMongoDB();
    return UserModel.findById(id).select('-passwordHash').lean();
  },

  async findByUsername(username: string) {
    await connectToMongoDB();
    return UserModel.findOne({ username }).lean();
  },

  async findByEmail(email: string) {
    await connectToMongoDB();
    return UserModel.findOne({ email }).select('-passwordHash').lean();
  },

  async findByIdWithPassword(id: string) {
    await connectToMongoDB();
    return UserModel.findById(id).lean();
  },

  async findByIds(ids: string[]) {
    await connectToMongoDB();
    return UserModel.find({ _id: { $in: ids } })
      .select('_id username email')
      .lean();
  },

  async existsByUsername(username: string, excludeId?: string): Promise<boolean> {
    await connectToMongoDB();
    const query: Record<string, unknown> = { username };
    if (excludeId) query._id = { $ne: excludeId };
    return (await UserModel.exists(query)) !== null;
  },

  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    await connectToMongoDB();
    const query: Record<string, unknown> = { email };
    if (excludeId) query._id = { $ne: excludeId };
    return (await UserModel.exists(query)) !== null;
  },

  async create(data: { username: string; email: string; passwordHash: string; role: string; isGuest?: boolean }) {
    await connectToMongoDB();
    return UserModel.create(data);
  },

  async update(id: string, updates: Record<string, unknown>) {
    await connectToMongoDB();
    return UserModel.findByIdAndUpdate(id, { $set: updates }, { new: true })
      .select('-passwordHash')
      .lean();
  },

  async updatePassword(id: string, passwordHash: string) {
    await connectToMongoDB();
    return UserModel.findByIdAndUpdate(id, { passwordHash });
  },

  async delete(id: string) {
    await connectToMongoDB();
    return UserModel.findByIdAndDelete(id);
  },

  async markOnboardingComplete(id: string) {
    await connectToMongoDB();
    return UserModel.findByIdAndUpdate(id, { $set: { onboardingCompletedAt: new Date() } });
  },

  async search(q: string, limit = 10) {
    await connectToMongoDB();
    return UserModel.find({
      isGuest: { $ne: true },
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
    })
      .sort({ username: 1 })
      .limit(limit)
      .select('_id username email')
      .lean();
  },
};
