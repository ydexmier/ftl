import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupService } from '@/src/services/GroupService';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { GroupTournamentRepository } from '@/src/repositories/db/GroupTournamentRepository';
import { hasRole } from '@/src/lib/auth/rbac';
import { ApiResponse } from '@/src/lib/api/responses';
import { validateAdminGroupBody } from '@/src/lib/validation';

async function getAdminAuth(request: NextRequest) {
  const auth = await getAuthSession(request);
  if (!auth) return { auth: null, error: ApiResponse.unauthorized() };
  if (!hasRole(auth.role as 'USER' | 'ADMIN' | 'SUPERUSER', 'ADMIN')) return { auth: null, error: ApiResponse.forbidden() };
  return { auth, error: null };
}

export async function GET(request: NextRequest) {
  const { auth, error } = await getAdminAuth(request);
  if (!auth) return error!;

  const groups = await GroupRepository.findAll();
  const enriched = await Promise.all(
    groups.map(async (g) => {
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
  return ApiResponse.ok({ groups: enriched });
}

export async function POST(request: NextRequest) {
  const { auth, error } = await getAdminAuth(request);
  if (!auth) return error!;

  const v = validateAdminGroupBody(await request.json());
  if (!v.ok) return ApiResponse.badRequest(v.error);
  try {
    const group = await GroupService.createGroup(auth.userId, v.data);
    return ApiResponse.created(group);
  } catch (err) {
    return ApiResponse.badRequest((err as Error).message);
  }
}
