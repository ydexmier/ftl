import GroupModel from '@models/Group';
import connectToMongoDB from '@/src/lib/db';
import type { GroupMemberRole } from '@/src/types/group';

export const GroupRepository = {
  async findById(id: string) {
    await connectToMongoDB();
    return GroupModel.findById(id).lean();
  },

  async findByMemberId(userId: string) {
    await connectToMongoDB();
    return GroupModel.find({ 'members.userId': userId }).lean();
  },

  async findByName(name: string) {
    await connectToMongoDB();
    return GroupModel.findOne({ name }).lean();
  },

  async create(data: { name: string; description?: string; createdBy: string }) {
    await connectToMongoDB();
    return GroupModel.create({
      name: data.name,
      description: data.description,
      createdBy: data.createdBy,
      members: [
        {
          userId: data.createdBy,
          role: 'ADMIN' as GroupMemberRole,
          joinedAt: new Date(),
          invitedBy: data.createdBy,
        },
      ],
    });
  },

  async update(id: string, data: { name?: string; description?: string }) {
    await connectToMongoDB();
    return GroupModel.findByIdAndUpdate(id, data, { new: true }).lean();
  },

  async delete(id: string) {
    await connectToMongoDB();
    return GroupModel.findByIdAndDelete(id);
  },

  async addMember(
    groupId: string,
    userId: string,
    invitedBy: string,
    role: GroupMemberRole = 'MEMBER',
  ) {
    await connectToMongoDB();
    return GroupModel.findByIdAndUpdate(
      groupId,
      {
        $push: {
          members: { userId, role, joinedAt: new Date(), invitedBy },
        },
      },
      { new: true },
    ).lean();
  },

  async removeMember(groupId: string, userId: string) {
    await connectToMongoDB();
    return GroupModel.findByIdAndUpdate(
      groupId,
      { $pull: { members: { userId } } },
      { new: true },
    ).lean();
  },

  async updateMemberRole(groupId: string, userId: string, role: GroupMemberRole) {
    await connectToMongoDB();
    return GroupModel.findOneAndUpdate(
      { _id: groupId, 'members.userId': userId },
      { $set: { 'members.$.role': role } },
      { new: true },
    ).lean();
  },

  async isMember(groupId: string, userId: string): Promise<boolean> {
    await connectToMongoDB();
    const count = await GroupModel.countDocuments({
      _id: groupId,
      'members.userId': userId,
    });
    return count > 0;
  },

  async isAdmin(groupId: string, userId: string): Promise<boolean> {
    await connectToMongoDB();
    const count = await GroupModel.countDocuments({
      _id: groupId,
      members: { $elemMatch: { userId, role: 'ADMIN' } },
    });
    return count > 0;
  },
};
