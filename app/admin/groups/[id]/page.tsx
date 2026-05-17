import { notFound } from 'next/navigation';
import { GroupService } from '@/src/services/GroupService';
import { GroupDetailClient } from '@components/admin/groups/GroupDetailClient';
import connectToMongoDB from '@/src/lib/db';

type Props = { params: Promise<{ id: string }> };

export default async function AdminGroupDetailPage({ params }: Props) {
  await connectToMongoDB();
  const { id } = await params;

  let group;
  try {
    group = await GroupService.adminGetGroupDetail(id);
  } catch {
    notFound();
  }

  return (
    <GroupDetailClient
      groupId={group._id}
      groupName={group.name}
      description={group.description}
      members={group.members.map((m) => ({
        ...m,
        joinedAt: m.joinedAt instanceof Date ? m.joinedAt.toISOString() : String(m.joinedAt),
      }))}
      tournaments={group.tournaments.map((t) => ({
        ...t,
        start_datetime: t.start_datetime instanceof Date ? t.start_datetime.toISOString() : t.start_datetime ? String(t.start_datetime) : null,
      }))}
    />
  );
}
