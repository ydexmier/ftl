import connectToMongoDB from '@/src/lib/db';
import UserModel from '@models/User';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { UsersPageClient } from '@components/admin/users/UsersPageClient';

interface SearchParams {
  page?: string;
  search?: string;
  role?: string;
}

export default async function UsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const search = params.search?.trim() ?? '';
  const role = params.role ?? '';
  const limit = 25;

  await connectToMongoDB();

  const query: Record<string, unknown> = {};
  if (search) {
    query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (role) query.role = role;

  const [rawUsers, total] = await Promise.all([
    UserModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-passwordHash')
      .lean(),
    UserModel.countDocuments(query),
  ]);

  const userIds = rawUsers.map((u) => String(u._id));
  const rawGroups = userIds.length > 0 ? await GroupRepository.findByMemberIds(userIds) : [];

  const groupsByUserId: Record<string, { _id: string; name: string }[]> = {};
  for (const group of rawGroups) {
    for (const member of group.members) {
      const uid = String(member.userId);
      if (!groupsByUserId[uid]) groupsByUserId[uid] = [];
      groupsByUserId[uid].push({ _id: String(group._id), name: group.name });
    }
  }

  const users = rawUsers.map((u) => ({
    _id: String(u._id),
    username: u.username,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    groups: groupsByUserId[String(u._id)] ?? [],
  }));

  return (
    <UsersPageClient
      users={users}
      total={total}
      page={page}
      pages={Math.ceil(total / limit)}
      search={search}
      role={role}
    />
  );
}
