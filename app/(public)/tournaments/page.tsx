import { getServerUser } from '@/src/lib/auth/getServerUser';
import { TournamentRepository } from '@/src/repositories/db/TournamentRepository';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { GroupTournamentRepository } from '@/src/repositories/db/GroupTournamentRepository';
import { UserTournamentRepository } from '@/src/repositories/db/UserTournamentRepository';
import { UserRepository } from '@/src/repositories/db/UserRepository';
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

  if (!user) {
    return (
      <TournamentsPageClient
        personalTournaments={[]}
        groupSections={[]}
        invitedTournaments={[]}
        isGuest={false}
      />
    );
  }

  const fullUser = await UserRepository.findById(user.userId);
  const isGuest = fullUser?.isGuest ?? false;

  // Guest flow : show their invited tournaments only
  if (isGuest) {
    const accesses = await TournamentExternalAccessRepository.findByUserId(user.userId);
    const activeAccesses = accesses.filter(
      (a) => a.status === 'ACCEPTED' && a.expiresAt > new Date(),
    );

    const tournamentIds = [...new Set(activeAccesses.map((a) => a.tournamentId))];
    const groupIds = [...new Set(activeAccesses.map((a) => String(a.groupId)))];

    const [tournaments, groups] = await Promise.all([
      TournamentRepository.findByIds(tournamentIds),
      Promise.all(groupIds.map((gid) => GroupRepository.findById(gid))),
    ]);

    const tournamentMap = new Map(tournaments.map((t) => [t.id, t]));
    const groupMap = new Map(
      groups.filter(Boolean).map((g) => [String(g!._id), g!.name]),
    );

    const invitedTournaments = activeAccesses
      .map((a) => {
        const t = tournamentMap.get(a.tournamentId);
        if (!t) return null;
        return {
          accessId: String(a._id),
          groupId: String(a.groupId),
          groupName: groupMap.get(String(a.groupId)) ?? 'Groupe',
          expiresAt: a.expiresAt.toISOString(),
          tournament: serializeTournament(t),
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);

    return (
      <TournamentsPageClient
        personalTournaments={[]}
        groupSections={[]}
        invitedTournaments={invitedTournaments}
        isGuest={true}
      />
    );
  }

  // Normal user flow
  const groups = await GroupRepository.findByMemberId(user.userId);

  const groupSectionsData = await Promise.all(
    groups.map(async (g) => {
      const groupId = String(g._id);
      const [gtsActive, gtsArchived] = await Promise.all([
        GroupTournamentRepository.findByGroupId(groupId, 'ACTIVE'),
        GroupTournamentRepository.findByGroupId(groupId, 'ARCHIVED'),
      ]);
      return {
        group: g,
        groupId,
        tournamentIds: gtsActive.map((gt) => gt.tournamentId),
        archivedTournamentIds: gtsArchived.map((gt) => gt.tournamentId),
      };
    }),
  );

  const [userLinksActive, userLinksArchived] = await Promise.all([
    UserTournamentRepository.findByUserId(user.userId, 'ACTIVE'),
    UserTournamentRepository.findByUserId(user.userId, 'ARCHIVED'),
  ]);
  const userTournamentIds = userLinksActive.map((l) => l.tournamentId);
  const archivedTournamentIds = userLinksArchived.map((l) => l.tournamentId);

  const allGroupTournamentIds = groupSectionsData.flatMap((s) => [...s.tournamentIds, ...s.archivedTournamentIds]);
  const allNeededIds = [...new Set([...userTournamentIds, ...archivedTournamentIds, ...allGroupTournamentIds])];

  const neededTournaments = await TournamentRepository.findByIds(allNeededIds);
  const tournamentMap = new Map(neededTournaments.map((t) => [t.id, t]));

  const personalTournaments = userTournamentIds
    .map((id) => tournamentMap.get(id))
    .filter((t): t is ITournament => t !== undefined)
    .sort((a, b) => new Date(b.start_datetime ?? 0).getTime() - new Date(a.start_datetime ?? 0).getTime())
    .map(serializeTournament);

  const archivedTournaments = archivedTournamentIds
    .map((id) => tournamentMap.get(id))
    .filter((t): t is ITournament => t !== undefined)
    .sort((a, b) => new Date(b.start_datetime ?? 0).getTime() - new Date(a.start_datetime ?? 0).getTime())
    .map(serializeTournament);

  const groupSections = groupSectionsData.map(({ group, groupId, tournamentIds, archivedTournamentIds: archivedIds }) => {
    const tournaments = tournamentIds
      .map((id) => tournamentMap.get(id))
      .filter((t): t is ITournament => t !== undefined)
      .sort((a, b) => new Date(b.start_datetime ?? 0).getTime() - new Date(a.start_datetime ?? 0).getTime())
      .map(serializeTournament);
    const archivedGroupTournaments = archivedIds
      .map((id) => tournamentMap.get(id))
      .filter((t): t is ITournament => t !== undefined)
      .sort((a, b) => new Date(b.start_datetime ?? 0).getTime() - new Date(a.start_datetime ?? 0).getTime())
      .map(serializeTournament);
    return {
      groupId,
      groupName: group.name,
      myRole: group.members.find((m) => String(m.userId) === user.userId)?.role ?? 'MEMBER',
      tournaments,
      archivedTournaments: archivedGroupTournaments,
    };
  });

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
      personalTournaments={personalTournaments}
      archivedTournaments={archivedTournaments}
      groupSections={groupSections.filter((s) => s.tournaments.length > 0 || groups.length > 0)}
      invitedTournaments={[]}
      adminGroups={adminGroups}
      initialAssignments={initialAssignments}
      isGuest={false}
    />
  );
}
