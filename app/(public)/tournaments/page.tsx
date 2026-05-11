import { getServerUser } from '@/src/lib/auth/getServerUser';
import { TournamentRepository } from '@/src/repositories/db/TournamentRepository';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { GroupTournamentRepository } from '@/src/repositories/db/GroupTournamentRepository';
import { TournamentExternalAccessRepository } from '@/src/repositories/db/TournamentExternalAccessRepository';
import connectToMongoDB from '@/src/lib/db';
import { TournamentsPageClient } from '@components/tournament/TournamentsPageClient';
import type { ITournament } from '@models/Tournament';

function serializeTournament(t: ITournament) {
  return {
    id: t.id,
    name: t.name,
    start_datetime: t.start_datetime instanceof Date ? t.start_datetime.toISOString() : String(t.start_datetime ?? ''),
    end_datetime: t.end_datetime ? (t.end_datetime instanceof Date ? t.end_datetime.toISOString() : String(t.end_datetime)) : null,
    event_status: t.event_status,
    registered_user_count: t.registered_user_count ?? 0,
    capacity: t.capacity ?? 0,
    store: t.store ? { name: t.store.name } : null,
    gameplay_format: t.gameplay_format ? { id: t.gameplay_format.id, name: t.gameplay_format.name } : null,
  };
}

export default async function TournamentsPage() {
  await connectToMongoDB();
  const user = await getServerUser();

  const allTournaments = (await TournamentRepository.findAll()).sort(
    (a, b) =>
      new Date(b.start_datetime ?? 0).getTime() -
      new Date(a.start_datetime ?? 0).getTime(),
  );

  const publicTournaments = allTournaments.map(serializeTournament);

  if (!user) {
    return (
      <TournamentsPageClient
        publicTournaments={publicTournaments}
        groupSections={[]}
        invitedTournaments={[]}
      />
    );
  }

  const groups = await GroupRepository.findByMemberId(user.userId);

  const groupSections = await Promise.all(
    groups.map(async (g) => {
      const groupId = String(g._id);
      const gts = await GroupTournamentRepository.findByGroupId(groupId);
      const tournaments = gts
        .map((gt) => allTournaments.find((t) => t.id === gt.tournamentId))
        .filter((t): t is ITournament => t !== undefined)
        .map(serializeTournament);
      return {
        groupId,
        groupName: g.name,
        myRole: g.members.find((m) => String(m.userId) === user.userId)?.role ?? 'MEMBER',
        tournaments,
      };
    }),
  );

  const accesses = await TournamentExternalAccessRepository.findAcceptedByUser(user.userId);
  const invitedTournaments = await Promise.all(
    accesses.map(async (acc) => {
      const tournament = allTournaments.find((t) => t.id === acc.tournamentId);
      const group = groups.find((g) => String(g._id) === String(acc.groupId))
        ?? await GroupRepository.findById(String(acc.groupId));
      return {
        accessId: String(acc._id),
        groupId: String(acc.groupId),
        groupName: group?.name ?? 'Groupe inconnu',
        expiresAt: acc.expiresAt.toISOString(),
        tournament: tournament ? serializeTournament(tournament) : null,
      };
    }),
  );

  const adminGroups = groupSections
    .filter((s) => s.myRole === 'ADMIN')
    .map((s) => ({ groupId: s.groupId, groupName: s.groupName }));

  const initialAssignments: Record<number, string[]> = {};
  for (const section of groupSections) {
    for (const t of section.tournaments) {
      if (!initialAssignments[t.id]) initialAssignments[t.id] = [];
      initialAssignments[t.id].push(section.groupId);
    }
  }

  return (
    <TournamentsPageClient
      publicTournaments={publicTournaments}
      groupSections={groupSections.filter((s) => s.tournaments.length > 0 || groups.length > 0)}
      invitedTournaments={invitedTournaments.filter((i): i is typeof i & { tournament: NonNullable<typeof i.tournament> } => i.tournament !== null)}
      adminGroups={adminGroups}
      initialAssignments={initialAssignments}
    />
  );
}
