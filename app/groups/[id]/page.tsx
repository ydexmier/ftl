import { redirect, notFound } from 'next/navigation';
import { getServerUser } from '@/src/lib/auth/getServerUser';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { GroupTournamentRepository } from '@/src/repositories/db/GroupTournamentRepository';
import { GroupInvitationRepository } from '@/src/repositories/db/GroupInvitationRepository';
import { TournamentRepository } from '@/src/repositories/db/TournamentRepository';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { GroupDetail } from '@components/groups/GroupDetail';
import connectToMongoDB from '@/src/lib/db';
import UserModel from '@models/User';

type Params = { params: Promise<{ id: string }> };

export default async function GroupPage({ params }: Params) {
  const user = await getServerUser();
  if (!user) redirect('/login');

  const { id } = await params;
  await connectToMongoDB();

  const group = await GroupRepository.findById(id);
  if (!group) notFound();

  const isMember = group.members.some((m) => String(m.userId) === user.userId);
  if (!isMember) redirect('/groups');

  const myRole = group.members.find((m) => String(m.userId) === user.userId)?.role ?? 'MEMBER';

  const memberIds = group.members.map((m) => m.userId);
  const [users, groupTournaments, pendingInvitationsRaw] = await Promise.all([
    UserModel.find({ _id: { $in: memberIds } }).select('_id username email').lean(),
    GroupTournamentRepository.findByGroupId(id),
    myRole === 'ADMIN' ? GroupInvitationRepository.findPendingByGroup(id) : Promise.resolve([]),
  ]);
  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));

  const tournamentIds = groupTournaments.map((gt) => gt.tournamentId);
  const tournaments = tournamentIds.length > 0 ? await TournamentRepository.findByIds(tournamentIds) : [];
  const tournamentMap = Object.fromEntries(tournaments.map((t) => [t.id, t]));

  const invitedUserIds = [
    ...pendingInvitationsRaw.map((i) => String(i.invitedUserId)),
    ...pendingInvitationsRaw.map((i) => String(i.invitedBy)),
  ];
  const invitationUsers = invitedUserIds.length > 0 ? await UserRepository.findByIds(invitedUserIds) : [];
  const invitationUserMap = Object.fromEntries(invitationUsers.map((u) => [String(u._id), u]));

  const serialized = {
    _id: String(group._id),
    name: group.name,
    description: group.description,
    createdBy: String(group.createdBy),
    members: group.members.map((m) => ({
      userId: String(m.userId),
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
      invitedBy: String(m.invitedBy),
      username: userMap[String(m.userId)]?.username ?? '',
      email: userMap[String(m.userId)]?.email ?? '',
    })),
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
  };

  const groupTournamentList = groupTournaments.map((gt) => ({
    tournamentId: gt.tournamentId,
    name: tournamentMap[gt.tournamentId]?.name ?? String(gt.tournamentId),
  }));

  const pendingInvitations = pendingInvitationsRaw.map((i) => ({
    _id: String(i._id),
    invitedUserId: String(i.invitedUserId),
    username: invitationUserMap[String(i.invitedUserId)]?.username ?? '',
    email: invitationUserMap[String(i.invitedUserId)]?.email ?? '',
    invitedByUsername: invitationUserMap[String(i.invitedBy)]?.username ?? '',
    expiresAt: i.expiresAt.toISOString(),
  }));

  return (
    <GroupDetail
      group={serialized}
      currentUserId={user.userId}
      myRole={myRole}
      groupTournaments={groupTournamentList}
      pendingInvitations={pendingInvitations}
    />
  );
}
