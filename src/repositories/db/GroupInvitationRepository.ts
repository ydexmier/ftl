import GroupInvitationModel from '@models/GroupInvitation';
import connectToMongoDB from '@/src/lib/db';
import type { GroupInvitationStatus } from '@/src/types/group';

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

export const GroupInvitationRepository = {
  async findById(id: string) {
    await connectToMongoDB();
    return GroupInvitationModel.findById(id).lean();
  },

  async findPendingByUser(userId: string) {
    await connectToMongoDB();
    return GroupInvitationModel.find({
      invitedUserId: userId,
      status: 'PENDING',
      expiresAt: { $gt: new Date() },
    }).lean();
  },

  async findByGroupId(groupId: string) {
    await connectToMongoDB();
    return GroupInvitationModel.find({ groupId }).lean();
  },

  async create(groupId: string, invitedUserId: string, invitedBy: string) {
    await connectToMongoDB();
    return GroupInvitationModel.create({
      groupId,
      invitedUserId,
      invitedBy,
      status: 'PENDING' as GroupInvitationStatus,
      expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
    });
  },

  async updateStatus(id: string, status: GroupInvitationStatus) {
    await connectToMongoDB();
    return GroupInvitationModel.findByIdAndUpdate(id, { status }, { new: true }).lean();
  },

  async hasPendingInvitation(groupId: string, invitedUserId: string): Promise<boolean> {
    await connectToMongoDB();
    return (await GroupInvitationModel.exists({
      groupId,
      invitedUserId,
      status: 'PENDING',
      expiresAt: { $gt: new Date() },
    })) !== null;
  },
};
