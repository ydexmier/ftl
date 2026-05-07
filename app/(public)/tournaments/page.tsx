import { getServerUser } from '@/src/lib/auth/getServerUser';
import { TournamentRepository } from '@/src/repositories/db/TournamentRepository';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { GroupTournamentRepository } from '@/src/repositories/db/GroupTournamentRepository';
import { TournamentExternalAccessRepository } from '@/src/repositories/db/TournamentExternalAccessRepository';
import connectToMongoDB from '@/src/lib/db';
import { TournamentsPageClient } from '@components/tournament/TournamentsPageClient';
import type { Tournament } from '@/src/types/tournament';

function serializeTournament(t: Tournament) {
  return {
    id: t.id,
    name: t.name,
    full_header_image_url: t.full_header_image_url,
    start_datetime: t.start_datetime,
    event_status: t.event_status,
    store: t.store ? { name: t.store.name } : null,
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
        .filter((t): t is Tournament => t !== undefined)
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

  return (
    <TournamentsPageClient
      publicTournaments={publicTournaments}
      groupSections={groupSections.filter((s) => s.tournaments.length > 0 || groups.length > 0)}
      invitedTournaments={invitedTournaments.filter((i): i is typeof i & { tournament: NonNullable<typeof i.tournament> } => i.tournament !== null)}
    />
  );
}
