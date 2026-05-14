import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { ScoutingReportRepository } from '@/src/repositories/db/ScoutingReportRepository';
import { UserRepository } from '@/src/repositories/db/UserRepository';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; tid: string }> },
) {
  const session = await getAuthSession(req);
  if (!session) return ApiResponse.unauthorized();

  const { id: groupId, tid } = await params;
  const tournamentId = Number(tid);
  if (isNaN(tournamentId)) return ApiResponse.badRequest('ID de tournoi invalide');

  const isAdmin = await GroupRepository.isAdmin(groupId, session.userId);
  if (!isAdmin && session.role !== 'ADMIN' && session.role !== 'SUPERUSER') {
    return ApiResponse.forbidden();
  }

  try {
    const counts = await ScoutingReportRepository.countByGroupAndTournament(groupId, tournamentId);

    const userIds = counts.map((c) => String(c.userId));
    const users = await UserRepository.findByIds(userIds);
    const userMap = Object.fromEntries(users.map((u) => [String(u._id), u.username]));

    const reports = counts.map((c) => ({
      userId: String(c.userId),
      username: userMap[String(c.userId)] ?? 'Inconnu',
      count: c.count,
    })).sort((a, b) => b.count - a.count);

    return ApiResponse.ok({ reports });
  } catch (err) {
    return ApiResponse.serverError(err);
  }
}
