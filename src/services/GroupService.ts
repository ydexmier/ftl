import { v4 as uuidv4 } from 'uuid';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { GroupTournamentRepository } from '@/src/repositories/db/GroupTournamentRepository';
import { GroupInvitationRepository } from '@/src/repositories/db/GroupInvitationRepository';
import { TournamentExternalAccessRepository } from '@/src/repositories/db/TournamentExternalAccessRepository';
import { TournamentRepository } from '@/src/repositories/db/TournamentRepository';
import { TournamentPlayersDeckRepository } from '@/src/repositories/db/TournamentPlayersDeckRepository';
import { TournamentConflictRepository } from '@/src/repositories/db/TournamentConflictRepository';
import { ScoutingReportRepository } from '@/src/repositories/db/ScoutingReportRepository';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { sendGuestInvitationEmail } from '@/src/lib/email';
import type { GroupMemberRole } from '@/src/types/group';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

async function assertGroupAdmin(groupId: string, userId: string) {
  const isAdmin = await GroupRepository.isAdmin(groupId, userId);
  if (!isAdmin) throw new Error('FORBIDDEN');
}

async function assertGroupMember(groupId: string, userId: string) {
  const isMember = await GroupRepository.isMember(groupId, userId);
  if (!isMember) throw new Error('FORBIDDEN');
}

async function checkTournamentsFinished(groupId: string) {
  const groupTournaments = await GroupTournamentRepository.findByGroupId(groupId);
  for (const gt of groupTournaments) {
    const tournament = await TournamentRepository.findById(gt.tournamentId);
    if (!tournament) continue;
    const cutoff = new Date(tournament.start_datetime.getTime() + THREE_DAYS_MS);
    if (cutoff > new Date()) throw new Error('TOURNAMENT_ACTIVE');
  }
}

async function cascadeDeleteGroup(groupId: string) {
  await Promise.all([
    TournamentPlayersDeckRepository.deleteManyByGroupId(groupId),
    TournamentConflictRepository.deleteManyByGroupId(groupId),
    ScoutingReportRepository.deleteManyByGroupId(groupId),
    GroupTournamentRepository.deleteByGroupId(groupId),
    GroupInvitationRepository.deleteManyByGroupId(groupId),
  ]);
  return GroupRepository.delete(groupId);
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
    await checkTournamentsFinished(groupId);
    return cascadeDeleteGroup(groupId);
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
    email: string,
    tournamentId: number,
    expiresAt?: Date,
  ) {
    await assertGroupAdmin(groupId, adminId);

    if (!email || !email.includes('@')) throw new Error('Email invalide');

    const hasAccess = await GroupTournamentRepository.hasAccess(groupId, tournamentId);
    if (!hasAccess) throw new Error('Ce tournoi n\'appartient pas au groupe');

    const alreadyActive = await TournamentExternalAccessRepository.hasActiveAccessByEmail(
      email,
      groupId,
      tournamentId,
    );
    if (alreadyActive) throw new Error('Un accès actif existe déjà pour cet email sur ce tournoi');

    const [group, tournament] = await Promise.all([
      GroupRepository.findById(groupId),
      TournamentRepository.findById(tournamentId),
    ]);
    if (!group) throw new Error('Groupe introuvable');
    if (!tournament) throw new Error('Tournoi introuvable');

    const accessToken = uuidv4();
    const access = await TournamentExternalAccessRepository.create({
      groupId,
      tournamentId,
      invitedBy: adminId,
      email,
      accessToken,
      expiresAt,
    });

    await sendGuestInvitationEmail(email, accessToken, tournament.name, group.name, access.expiresAt);
    return access;
  },

  async getExternalAccessList(groupId: string, adminId: string, tournamentId: number) {
    await assertGroupAdmin(groupId, adminId);
    return TournamentExternalAccessRepository.findByGroupAndTournament(groupId, tournamentId);
  },

  async revokeExternalAccess(accessId: string, adminId: string) {
    const access = await TournamentExternalAccessRepository.findById(accessId);
    if (!access) throw new Error('NOT_FOUND');
    await assertGroupAdmin(String(access.groupId), adminId);
    if (access.status === 'REVOKED' || access.status === 'EXPIRED') {
      throw new Error('Cet accès est déjà révoqué ou expiré');
    }
    return TournamentExternalAccessRepository.revokeAccess(accessId);
  },

  // ─── Admin-only operations (bypass group membership check) ─────────────────

  async adminGetGroupDetail(groupId: string) {
    const group = await GroupRepository.findById(groupId);
    if (!group) throw new Error('NOT_FOUND');

    const memberIds = group.members.map((m) => String(m.userId));
    const [users, groupTournaments, pendingInvitations] = await Promise.all([
      UserRepository.findByIds(memberIds),
      GroupTournamentRepository.findByGroupId(groupId),
      GroupInvitationRepository.findPendingByGroup(groupId),
    ]);
    const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));

    const tournamentIds = groupTournaments.map((gt) => gt.tournamentId);
    const tournaments = tournamentIds.length > 0 ? await TournamentRepository.findByIds(tournamentIds) : [];
    const tournamentMap = Object.fromEntries(tournaments.map((t) => [t.id, t]));

    const invitedUserIds = [
      ...pendingInvitations.map((i) => String(i.invitedUserId)),
      ...pendingInvitations.map((i) => String(i.invitedBy)),
    ];
    const invitationUsers = invitedUserIds.length > 0 ? await UserRepository.findByIds(invitedUserIds) : [];
    const invitationUserMap = Object.fromEntries(invitationUsers.map((u) => [String(u._id), u]));

    return {
      _id: String(group._id),
      name: group.name,
      description: group.description,
      createdAt: group.createdAt,
      members: group.members.map((m) => ({
        userId: String(m.userId),
        username: userMap[String(m.userId)]?.username ?? '',
        email: userMap[String(m.userId)]?.email ?? '',
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      tournaments: groupTournaments.map((gt) => ({
        tournamentId: gt.tournamentId,
        name: tournamentMap[gt.tournamentId]?.name ?? String(gt.tournamentId),
        start_datetime: tournamentMap[gt.tournamentId]?.start_datetime ?? null,
        status: gt.status,
      })),
      pendingInvitations: pendingInvitations.map((i) => ({
        _id: String(i._id),
        invitedUserId: String(i.invitedUserId),
        username: invitationUserMap[String(i.invitedUserId)]?.username ?? '',
        email: invitationUserMap[String(i.invitedUserId)]?.email ?? '',
        invitedByUsername: invitationUserMap[String(i.invitedBy)]?.username ?? '',
        expiresAt: i.expiresAt,
      })),
    };
  },

  async adminInviteMember(groupId: string, invitedBy: string, invitedUserId: string) {
    const group = await GroupRepository.findById(groupId);
    if (!group) throw new Error('NOT_FOUND');

    const alreadyMember = await GroupRepository.isMember(groupId, invitedUserId);
    if (alreadyMember) throw new Error('Cet utilisateur est déjà membre du groupe');

    const hasPending = await GroupInvitationRepository.hasPendingInvitation(groupId, invitedUserId);
    if (hasPending) throw new Error('Une invitation est déjà en attente pour cet utilisateur');

    const invitedUser = await UserRepository.findById(invitedUserId);
    if (!invitedUser) throw new Error('Utilisateur introuvable');

    return GroupInvitationRepository.create(groupId, invitedUserId, invitedBy);
  },

  async adminAddDirectMember(groupId: string, adminId: string, userId: string) {
    const group = await GroupRepository.findById(groupId);
    if (!group) throw new Error('NOT_FOUND');

    const alreadyMember = await GroupRepository.isMember(groupId, userId);
    if (alreadyMember) throw new Error('Cet utilisateur est déjà membre du groupe');

    const user = await UserRepository.findById(userId);
    if (!user) throw new Error('Utilisateur introuvable');

    return GroupRepository.addMember(groupId, userId, adminId);
  },

  async adminRemoveMember(groupId: string, userId: string) {
    const group = await GroupRepository.findById(groupId);
    if (!group) throw new Error('NOT_FOUND');

    const isMember = group.members.some((m) => String(m.userId) === userId);
    if (!isMember) throw new Error('NOT_FOUND');

    const admins = group.members.filter((m) => m.role === 'ADMIN');
    const isTargetAdmin = admins.some((m) => String(m.userId) === userId);
    if (isTargetAdmin && admins.length === 1) {
      throw new Error('Impossible de retirer le seul administrateur du groupe');
    }

    return GroupRepository.removeMember(groupId, userId);
  },

  async adminUpdateMemberRole(groupId: string, userId: string, role: GroupMemberRole) {
    const group = await GroupRepository.findById(groupId);
    if (!group) throw new Error('NOT_FOUND');

    const isMember = group.members.some((m) => String(m.userId) === userId);
    if (!isMember) throw new Error('NOT_FOUND');

    if (role === 'MEMBER') {
      const admins = group.members.filter((m) => m.role === 'ADMIN');
      const isTargetAdmin = admins.some((m) => String(m.userId) === userId);
      if (isTargetAdmin && admins.length === 1) {
        throw new Error('Impossible de retirer le seul administrateur du groupe');
      }
    }

    return GroupRepository.updateMemberRole(groupId, userId, role);
  },

  async adminAddTournament(groupId: string, addedBy: string, tournamentId: number) {
    const group = await GroupRepository.findById(groupId);
    if (!group) throw new Error('NOT_FOUND');

    const tournament = await TournamentRepository.findById(tournamentId);
    if (!tournament) throw new Error('Tournoi introuvable');

    const already = await GroupTournamentRepository.hasAccess(groupId, tournamentId);
    if (already) throw new Error('Ce tournoi est déjà dans le groupe');

    return GroupTournamentRepository.add(groupId, tournamentId, addedBy);
  },

  async adminRemoveTournament(groupId: string, tournamentId: number) {
    const group = await GroupRepository.findById(groupId);
    if (!group) throw new Error('NOT_FOUND');
    return GroupTournamentRepository.remove(groupId, tournamentId);
  },

  async adminDeleteGroup(groupId: string) {
    const group = await GroupRepository.findById(groupId);
    if (!group) throw new Error('NOT_FOUND');
    await checkTournamentsFinished(groupId);
    return cascadeDeleteGroup(groupId);
  },
};
