import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { TournamentExternalAccessRepository } from '@/src/repositories/db/TournamentExternalAccessRepository';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ id: string; tid: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const { id, tid } = await params;
  const tournamentId = Number(tid);

  const isAdmin = await GroupRepository.isAdmin(id, auth.userId);
  if (!isAdmin) return ApiResponse.forbidden();

  const accesses = await TournamentExternalAccessRepository.findPendingByGroupAndTournament(id, tournamentId);

  const userIds = accesses.filter((a) => a.userId != null).map((a) => String(a.userId));
  const users = userIds.length > 0 ? await UserRepository.findByIds(userIds) : [];
  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));

  const guests = accesses.map((a) => {
    const user = a.userId ? userMap[String(a.userId)] : null;
    return {
      _id: String(a._id),
      username: user?.username ?? null,
      email: user?.email ?? null,
      status: a.status,
      createdAt: a.createdAt,
    };
  });

  return ApiResponse.ok({ guests });
}
