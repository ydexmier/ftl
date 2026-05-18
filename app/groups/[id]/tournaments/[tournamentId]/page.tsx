import { redirect, notFound } from 'next/navigation';
import { getServerUser } from '@/src/lib/auth/getServerUser';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { TournamentRepository } from '@/src/repositories/db/TournamentRepository';
import { GroupTournamentRepository } from '@/src/repositories/db/GroupTournamentRepository';
import { GroupTournamentScoutingPage } from '@components/groups/GroupTournamentScoutingPage';
import connectToMongoDB from '@/src/lib/db';

type Params = { params: Promise<{ id: string; tournamentId: string }> };

export default async function GroupTournamentPage({ params }: Params) {
  const user = await getServerUser();
  if (!user) redirect('/login');

  const { id: groupId, tournamentId: tidParam } = await params;
  const tournamentId = Number(tidParam);
  if (isNaN(tournamentId)) notFound();

  await connectToMongoDB();

  const group = await GroupRepository.findById(groupId);
  if (!group) notFound();

  const isMember = group.members.some((m) => String(m.userId) === user.userId);
  if (!isMember) redirect('/groups');

  const groupTournament = await GroupTournamentRepository.findByGroupId(groupId);
  const belongs = groupTournament.some((gt) => gt.tournamentId === tournamentId);
  if (!belongs) notFound();

  const tournament = await TournamentRepository.findById(tournamentId);
  const tournamentName = tournament?.name ?? `Tournoi #${tournamentId}`;

  return (
    <GroupTournamentScoutingPage
      groupId={groupId}
      groupName={group.name}
      tournamentId={tournamentId}
      tournamentName={tournamentName}
    />
  );
}
