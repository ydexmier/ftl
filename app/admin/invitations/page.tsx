import connectToMongoDB from '@/src/lib/db';
import InvitationModel from '@models/Invitation';
import '@models/User';
import '@models/Group';
import { InvitationsPageClient } from '@components/admin/invitations/InvitationsPageClient';

interface SearchParams {
  page?: string;
  status?: string;
}

export default async function InvitationsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const status = params.status ?? '';
  const limit = 25;

  await connectToMongoDB();

  const query: Record<string, unknown> = {};
  if (status) query.status = status;

  const [rawInvitations, total] = await Promise.all([
    InvitationModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('invitedBy', 'username')
      .populate('groupIds', 'name')
      .lean(),
    InvitationModel.countDocuments(query),
  ]);

  const invitations = rawInvitations.map((inv) => ({
    _id: String(inv._id),
    email: inv.email,
    status: inv.status,
    expiresAt: inv.expiresAt.toISOString(),
    createdAt: inv.createdAt.toISOString(),
    usedAt: inv.usedAt?.toISOString() ?? null,
    invitedBy: inv.invitedBy ? { username: (inv.invitedBy as unknown as { username: string }).username } : null,
    groups: (inv.groupIds as unknown as { _id: unknown; name: string }[]).map((g) => ({
      _id: String(g._id),
      name: g.name,
    })),
  }));

  return (
    <InvitationsPageClient
      invitations={invitations}
      total={total}
      page={page}
      pages={Math.ceil(total / limit)}
      status={status}
    />
  );
}
