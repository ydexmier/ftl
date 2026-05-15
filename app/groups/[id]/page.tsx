import { redirect, notFound } from 'next/navigation';
import { getServerUser } from '@/src/lib/auth/getServerUser';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
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

  const memberIds = group.members.map((m) => m.userId);
  const users = await UserModel.find({ _id: { $in: memberIds } })
    .select('_id username email')
    .lean();
  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));

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

  const myRole = group.members.find((m) => String(m.userId) === user.userId)?.role ?? 'MEMBER';

  return <GroupDetail group={serialized} currentUserId={user.userId} myRole={myRole} />;
}
