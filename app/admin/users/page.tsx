import connectToMongoDB from '@/src/lib/db';
import UserModel from '@models/User';
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

  const users = rawUsers.map((u) => ({
    _id: String(u._id),
    username: u.username,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
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
