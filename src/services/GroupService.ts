import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { GroupTournamentRepository } from '@/src/repositories/db/GroupTournamentRepository';
import { GroupInvitationRepository } from '@/src/repositories/db/GroupInvitationRepository';
import { TournamentExternalAccessRepository } from '@/src/repositories/db/TournamentExternalAccessRepository';
import { TournamentRepository } from '@/src/repositories/db/TournamentRepository';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { DataMergeService } from '@/src/services/DataMergeService';
import type { GroupMemberRole } from '@/src/types/group';

async function assertGroupAdmin(groupId: string, userId: string) {
  const isAdmin = await GroupRepository.isAdmin(groupId, userId);
  if (!isAdmin) throw new Error('FORBIDDEN');
}

async function assertGroupMember(groupId: string, userId: string) {
  const isMember = await GroupRepository.isMember(groupId, userId);
  if (!isMember) throw new Error('FORBIDDEN');
}

export const GroupService = {
  // ─── Group CRUD ────────────────────────────────────────────────────────────

  async createGroup(userId: string, data: { name: string; description?: string }) {
    if (!data.name?.trim()) throw new Error('Le nom du groupe est requis');
    const existing = await GroupRepository.findByName(data.name.trim());
    if (existing) throw new Error('Ce nom de groupe est déjà pris');
    return GroupRepository.create({ ...data, createdBy: userId });
  },

  async getUserGroups(userId: string) {
    return GroupRepository.findByMemberId(userId);
  },

  async getGroupById(groupId: string, userId: string) {
    const group = await GroupRepository.findById(groupId);
    if (!group) throw new Error('NOT_FOUND');
    const isMember = group.members.some((m) => String(m.userId) === userId);
    if (!isMember) throw new Error('FORBIDDEN');

    const memberIds = group.members.map((m) => String(m.userId));
    const users = await UserRepository.findByIds(memberIds);
    const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));

    return {
      ...group,
      members: group.members.map((m) => ({
        ...m,
        username: userMap[String(m.userId)]?.username,
        email: userMap[String(m.userId)]?.email,
      })),
    };
  },

  async updateGroup(groupId: string, userId: string, data: { name?: string; description?: string }) {
    await assertGroupAdmin(groupId, userId);
    if (data.name) {
      const existing = await GroupRepository.findByName(data.name.trim());
      if (existing && String(existing._id) !== groupId) throw new Error('Ce nom de groupe est déjà pris');
    }
    return GroupRepository.update(groupId, data);
  },

  async deleteGroup(groupId: string, userId: string) {
    await assertGroupAdmin(groupId, userId);
    return GroupRepository.delete(groupId);
  },

  // ─── Members ───────────────────────────────────────────────────────────────

  async inviteMember(groupId: string, adminId: string, invitedUserId: string) {
    await assertGroupAdmin(groupId, adminId);

    const alreadyMember = await GroupRepository.isMember(groupId, invitedUserId);
    if (alreadyMember) throw new Error('Cet utilisateur est déjà membre du groupe');

    const hasPending = await GroupInvitationRepository.hasPendingInvitation(groupId, invitedUserId);
    if (hasPending) throw new Error('Une invitation est déjà en attente pour cet utilisateur');

    const invitedUser = await UserRepository.findById(invitedUserId);
    if (!invitedUser) throw new Error('Utilisateur introuvable');

    return GroupInvitationRepository.create(groupId, invitedUserId, adminId);
  },

  async removeMember(groupId: string, adminId: string, userId: string) {
    if (adminId !== userId) {
      await assertGroupAdmin(groupId, adminId);
    }
    await assertGroupMember(groupId, userId);

    const group = await GroupRepository.findById(groupId);
    if (!group) throw new Error('NOT_FOUND');

    const admins = group.members.filter((m) => m.role === 'ADMIN');
    const isTargetAdmin = admins.some((m) => String(m.userId) === userId);
    if (isTargetAdmin && admins.length === 1) {
      throw new Error('Impossible de retirer le seul administrateur du groupe');
    }

    return GroupRepository.removeMember(groupId, userId);
  },

  async updateMemberRole(groupId: string, adminId: string, userId: string, role: GroupMemberRole) {
    await assertGroupAdmin(groupId, adminId);
    await assertGroupMember(groupId, userId);

    if (role === 'MEMBER') {
      const group = await GroupRepository.findById(groupId);
      if (!group) throw new Error('NOT_FOUND');
      const admins = group.members.filter((m) => m.role === 'ADMIN');
      const isTargetAdmin = admins.some((m) => String(m.userId) === userId);
      if (isTargetAdmin && admins.length === 1) {
        throw new Error('Impossible de retirer le seul administrateur du groupe');
      }
    }

    return GroupRepository.updateMemberRole(groupId, userId, role);
  },

  // ─── Invitations ───────────────────────────────────────────────────────────

  async getMyInvitations(userId: string) {
    return GroupInvitationRepository.findPendingByUser(userId);
  },

  async respondToInvitation(invitationId: string, userId: string, status: 'ACCEPTED' | 'REJECTED') {
    const invitation = await GroupInvitationRepository.findById(invitationId);
    if (!invitation) throw new Error('NOT_FOUND');
    if (String(invitation.invitedUserId) !== userId) throw new Error('FORBIDDEN');
    if (invitation.status !== 'PENDING') throw new Error('Cette invitation a déjà été traitée');
    if (invitation.expiresAt < new Date()) throw new Error('Cette invitation a expiré');

    await GroupInvitationRepository.updateStatus(invitationId, status);

    if (status === 'ACCEPTED') {
      const groupId = String(invitation.groupId);
      await GroupRepository.addMember(groupId, userId, String(invitation.invitedBy), 'MEMBER');
      await DataMergeService.mergeOnGroupJoin(userId, groupId);
    }

    return { status };
  },

  // ─── Group Tournaments ─────────────────────────────────────────────────────

  async addTournament(groupId: string, userId: string, tournamentId: number) {
    await assertGroupAdmin(groupId, userId);

    const tournament = await TournamentRepository.findById(tournamentId);
    if (!tournament) throw new Error('Tournoi introuvable');

    const already = await GroupTournamentRepository.hasAccess(groupId, tournamentId);
    if (already) throw new Error('Ce tournoi est déjà dans le groupe');

    return GroupTournamentRepository.add(groupId, tournamentId, userId);
  },

  async removeTournament(groupId: string, userId: string, tournamentId: number) {
    await assertGroupAdmin(groupId, userId);
    return GroupTournamentRepository.remove(groupId, tournamentId);
  },

  async archiveGroupTournament(groupId: string, userId: string, tournamentId: number, status: 'ACTIVE' | 'ARCHIVED') {
    await assertGroupAdmin(groupId, userId);
    const entry = await GroupTournamentRepository.findByGroupAndTournament(groupId, tournamentId);
    if (!entry) throw new Error('Tournoi introuvable dans ce groupe');
    return GroupTournamentRepository.updateStatus(groupId, tournamentId, status);
  },

  async getGroupTournaments(groupId: string, userId: string) {
    await assertGroupMember(groupId, userId);
    return GroupTournamentRepository.findByGroupId(groupId);
  },

  // ─── External Access ────────────────────────────────────────────────────────

  async inviteExternal(
    groupId: string,
    adminId: string,
    invitedUserId: string,
    tournamentId: number,
    expiresAt?: Date,
  ) {
    await assertGroupAdmin(groupId, adminId);

    const alreadyMember = await GroupRepository.isMember(groupId, invitedUserId);
    if (alreadyMember) throw new Error('Cet utilisateur est déjà membre du groupe');

    const hasAccess = await GroupTournamentRepository.hasAccess(groupId, tournamentId);
    if (!hasAccess) throw new Error('Ce tournoi n\'appartient pas au groupe');

    const alreadyActive = await TournamentExternalAccessRepository.hasActiveAccess(
      invitedUserId,
      groupId,
      tournamentId,
    );
    if (alreadyActive) throw new Error('Cet utilisateur a déjà un accès actif pour ce tournoi');

    const invitedUser = await UserRepository.findById(invitedUserId);
    if (!invitedUser) throw new Error('Utilisateur introuvable');

    return TournamentExternalAccessRepository.create({
      groupId,
      tournamentId,
      userId: invitedUserId,
      invitedBy: adminId,
      expiresAt,
    });
  },

  async getExternalAccessList(groupId: string, adminId: string, tournamentId: number) {
    await assertGroupAdmin(groupId, adminId);
    return TournamentExternalAccessRepository.findByGroupAndTournament(groupId, tournamentId);
  },

  async getMyExternalAccesses(userId: string) {
    return TournamentExternalAccessRepository.findPendingByUser(userId);
  },

  async respondToExternalAccess(
    accessId: string,
    userId: string,
    status: 'ACCEPTED' | 'REJECTED',
  ) {
    const access = await TournamentExternalAccessRepository.findById(accessId);
    if (!access) throw new Error('NOT_FOUND');
    if (String(access.userId) !== userId) throw new Error('FORBIDDEN');
    if (access.status !== 'PENDING') throw new Error('Cet accès a déjà été traité');
    if (access.expiresAt < new Date()) throw new Error('Cet accès a expiré');
    return TournamentExternalAccessRepository.updateStatus(accessId, status);
  },
};
