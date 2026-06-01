import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupMagicLinkRepository } from '@/src/repositories/db/GroupMagicLinkRepository';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { GroupTournamentRepository } from '@/src/repositories/db/GroupTournamentRepository';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ id: string; tid: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const { id, tid } = await params;
  const tournamentId = Number(tid);

  const isAdmin = await GroupRepository.isAdmin(id, auth.userId);
  if (!isAdmin) return ApiResponse.forbidden();

  const link = await GroupMagicLinkRepository.findByGroupAndTournament(id, tournamentId);
  return ApiResponse.ok({ link });
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const { id, tid } = await params;
  const tournamentId = Number(tid);

  const isAdmin = await GroupRepository.isAdmin(id, auth.userId);
  if (!isAdmin) return ApiResponse.forbidden();

  const hasAccess = await GroupTournamentRepository.hasAccess(id, tournamentId);
  if (!hasAccess) return ApiResponse.notFound('Ce tournoi n\'appartient pas au groupe');

  const token = uuidv4();
  const link = await GroupMagicLinkRepository.upsert(id, tournamentId, auth.userId, token);
  return ApiResponse.created({ link });
}
