import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiTokenRepository } from '@/src/repositories/db/ApiTokenRepository';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ id: string; tokenId: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const { id, tokenId } = await params;
  const tournamentId = Number(id);
  if (isNaN(tournamentId)) return ApiResponse.badRequest('ID de tournoi invalide');

  const revoked = await ApiTokenRepository.revoke(tokenId, auth.userId, { userId: auth.userId });
  if (!revoked) return ApiResponse.notFound('Token introuvable');

  return ApiResponse.ok({ success: true });
}
