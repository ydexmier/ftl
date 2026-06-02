import GroupModel from '@models/Group';
import connectToMongoDB from '@/src/lib/db';
import type { GroupMemberRole } from '@/src/types/group';

export const GroupRepository = {
  async findById(id: string) {
    await connectToMongoDB();
    return GroupModel.findById(id).lean();
  },

  async findAll() {
    await connectToMongoDB();
    return GroupModel.find().sort({ name: 1 }).select('_id name').lean();
  },

  async findByMemberId(userId: string) {
    await connectToMongoDB();
    return GroupModel.find({ 'members.userId': userId }).lean();
  },

  async findByMemberIds(userIds: string[]) {
    await connectToMongoDB();
    return GroupModel.find({ 'members.userId': { $in: userIds } })
      .select('name members')
      .lean();
  },

  async findPinned() {
    await connectToMongoDB();
    return GroupModel.findOne({ isPinned: true }).select('_id name').lean();
  },

  async pin(groupId: string) {
    await connectToMongoDB();
    await GroupModel.updateMany({ isPinned: true }, { isPinned: false });
    return GroupModel.findByIdAndUpdate(groupId, { isPinned: true }, { new: true }).lean();
  },

  async unpin(groupId: string) {
    await connectToMongoDB();
    return GroupModel.findByIdAndUpdate(groupId, { isPinned: false }, { new: true }).lean();
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

  async update(id: string, data: { name?: string; description?: string; infoMessage?: string }) {
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
    return (await GroupModel.exists({ _id: groupId, 'members.userId': userId })) !== null;
  },

  async isAdmin(groupId: string, userId: string): Promise<boolean> {
    await connectToMongoDB();
    return (await GroupModel.exists({ _id: groupId, members: { $elemMatch: { userId, role: 'ADMIN' } } })) !== null;
  },

  async getMemberRole(groupId: string, userId: string): Promise<'ADMIN' | 'MEMBER' | null> {
    await connectToMongoDB();
    const group = await GroupModel.findOne(
      { _id: groupId },
      { members: { $elemMatch: { userId } } },
    ).lean();
    if (!group?.members?.length) return null;
    return (group.members[0] as { role: string }).role as 'ADMIN' | 'MEMBER';
  },

  async addMemberToGroups(groupIds: string[], userId: string, invitedBy: string) {
    await connectToMongoDB();
    return GroupModel.updateMany(
      { _id: { $in: groupIds } },
      {
        $push: {
          members: {
            userId,
            role: 'MEMBER' as GroupMemberRole,
            joinedAt: new Date(),
            invitedBy,
          },
        },
      },
    );
  },
};
