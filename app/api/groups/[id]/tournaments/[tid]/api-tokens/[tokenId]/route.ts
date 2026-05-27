import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { ApiTokenRepository } from '@/src/repositories/db/ApiTokenRepository';
import { ApiResponse } from '@/src/lib/api/responses';
import connectToMongoDB from '@/src/lib/db';

type Params = { params: Promise<{ id: string; tid: string; tokenId: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const { id: groupId, tid, tokenId } = await params;
  const tournamentId = Number(tid);
  if (isNaN(tournamentId)) return ApiResponse.badRequest('ID de tournoi invalide');

  await connectToMongoDB();

  const isAdmin = await GroupRepository.isAdmin(groupId, auth.userId);
  if (!isAdmin) return ApiResponse.forbidden();

  const revoked = await ApiTokenRepository.revoke(tokenId, auth.userId, { groupId });
  if (!revoked) return ApiResponse.notFound('Token introuvable');

  return ApiResponse.ok({ success: true });
}
