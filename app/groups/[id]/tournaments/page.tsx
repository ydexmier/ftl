import { redirect, notFound } from 'next/navigation';
import { getServerUser } from '@/src/lib/auth/getServerUser';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { GroupTournamentRepository } from '@/src/repositories/db/GroupTournamentRepository';
import { TournamentRepository } from '@/src/repositories/db/TournamentRepository';
import { GroupTournaments } from '@components/groups/GroupTournaments';
import connectToMongoDB from '@/src/lib/db';

type Params = { params: Promise<{ id: string }> };

export default async function GroupTournamentsPage({ params }: Params) {
  const user = await getServerUser();
  if (!user) redirect('/login');

  const { id } = await params;
  await connectToMongoDB();

  const group = await GroupRepository.findById(id);
  if (!group) notFound();

  const isMember = group.members.some((m) => String(m.userId) === user.userId);
  if (!isMember) redirect('/groups');

  const myRole = group.members.find((m) => String(m.userId) === user.userId)?.role ?? 'MEMBER';

  const groupTournaments = await GroupTournamentRepository.findByGroupId(id);
  const tournamentIds = groupTournaments.map((gt) => gt.tournamentId);
  const tournaments = await Promise.all(tournamentIds.map((tid) => TournamentRepository.findById(tid)));

  const serialized = groupTournaments.map((gt) => {
    const tournament = tournaments.find((t) => t?.id === gt.tournamentId);
    return {
      _id: String(gt._id),
      tournamentId: gt.tournamentId,
      addedBy: String(gt.addedBy),
      createdAt: gt.createdAt.toISOString(),
      name: tournament?.name ?? `Tournoi #${gt.tournamentId}`,
      eventStatus: tournament?.event_status ?? '',
      startDatetime: tournament?.start_datetime ?? '',
    };
  });

  return (
    <GroupTournaments
      groupId={id}
      groupName={group.name}
      tournaments={serialized}
      myRole={myRole}
    />
  );
}
