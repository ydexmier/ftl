import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { GroupInvitationRepository } from '@/src/repositories/db/GroupInvitationRepository';
import { GroupTournamentRepository } from '@/src/repositories/db/GroupTournamentRepository';

const NEW_TOURNAMENT_DAYS = 7;

export async function GET(request: NextRequest) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const { userId } = auth;

  const userGroups = await GroupRepository.findByMemberId(userId);

  const allGroupIds = userGroups.map((g) => String(g._id));
  const adminGroupIds = userGroups
    .filter((g) =>
      g.members?.some(
        (m: { userId: { toString(): string }; role: string }) =>
          m.userId.toString() === userId && m.role === 'ADMIN',
      ),
    )
    .map((g) => String(g._id));

  const since = new Date(Date.now() - NEW_TOURNAMENT_DAYS * 24 * 60 * 60 * 1000);

  const [groupInvitations, groupAdminInvitations, newGroupTournaments] = await Promise.all([
    GroupInvitationRepository.countPendingByUser(userId),
    adminGroupIds.length > 0
      ? GroupInvitationRepository.countPendingByGroupIds(adminGroupIds)
      : Promise.resolve(0),
    allGroupIds.length > 0
      ? GroupTournamentRepository.countRecentByGroupIds(allGroupIds, since)
      : Promise.resolve(0),
  ]);

  return ApiResponse.ok({ groupInvitations, groupAdminInvitations, newGroupTournaments });
}
