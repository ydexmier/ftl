import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { PlayerCommentRepository } from '@/src/repositories/db/PlayerCommentRepository';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession(req);
  if (!session) return ApiResponse.unauthorized();

  const { id } = await params;
  const tournamentId = Number(id);
  if (isNaN(tournamentId)) return ApiResponse.badRequest('ID de tournoi invalide');

  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get('groupId');
  const rawIds = searchParams.get('playerIds') ?? '';
  const playerIds = rawIds
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => !isNaN(n) && n > 0);

  if (playerIds.length === 0) return ApiResponse.ok({ counts: {} });

  if (groupId) {
    const isMember = await GroupRepository.isMember(groupId, session.userId);
    if (!isMember && session.role !== 'ADMIN' && session.role !== 'SUPERUSER') {
      return ApiResponse.forbidden();
    }
  }

  try {
    const scope = groupId ? { groupId } : { groupId: null as null };
    const counts = await PlayerCommentRepository.countByPlayers(tournamentId, playerIds, scope);
    return ApiResponse.ok({ counts });
  } catch (err) {
    return ApiResponse.serverError(err);
  }
}
