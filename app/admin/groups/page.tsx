import connectToMongoDB from '@/src/lib/db';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { GroupTournamentRepository } from '@/src/repositories/db/GroupTournamentRepository';
import { GroupsPageClient } from '@components/admin/groups/GroupsPageClient';

export default async function AdminGroupsPage() {
  await connectToMongoDB();

  const rawGroups = await GroupRepository.findAll();
  const groups = await Promise.all(
    rawGroups.map(async (g) => {
      const id = String(g._id);
      const full = await GroupRepository.findById(id);
      const tournaments = await GroupTournamentRepository.findByGroupId(id);
      return {
        _id: id,
        name: g.name,
        memberCount: full?.members.length ?? 0,
        tournamentCount: tournaments.length,
      };
    }),
  );

  return <GroupsPageClient groups={groups} />;
}
