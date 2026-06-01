import { redirect } from 'next/navigation';
import { getServerUser } from '@/src/lib/auth/getServerUser';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { GroupInvitationRepository } from '@/src/repositories/db/GroupInvitationRepository';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { GroupsList } from '@components/groups/GroupsList';
import connectToMongoDB from '@/src/lib/db';

export default async function GroupsPage() {
  const user = await getServerUser();
  if (!user) redirect('/login');

  const fullUser = await UserRepository.findById(user.userId);
  if (fullUser?.isGuest) redirect('/');

  await connectToMongoDB();
  const [rawGroups, rawInvitations] = await Promise.all([
    GroupRepository.findByMemberId(user.userId),
    GroupInvitationRepository.findPendingByUser(user.userId),
  ]);

  const groups = rawGroups.map((g) => ({
    _id: String(g._id),
    name: g.name,
    description: g.description,
    createdBy: String(g.createdBy),
    memberCount: g.members.length,
    myRole: g.members.find((m) => String(m.userId) === user.userId)?.role ?? 'MEMBER',
    createdAt: g.createdAt.toISOString(),
  }));

  const invitations = rawInvitations.map((inv) => ({
    _id: String(inv._id),
    groupId: String(inv.groupId),
    invitedBy: String(inv.invitedBy),
    expiresAt: inv.expiresAt.toISOString(),
  }));

  return <GroupsList groups={groups} invitations={invitations} currentUserId={user.userId} />;
}
