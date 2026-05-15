import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { ConflictService } from '@/src/services/ConflictService';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession(req);
  if (!session) return ApiResponse.unauthorized();

  const { id } = await params;
  const tournamentId = Number(id);
  if (isNaN(tournamentId)) return ApiResponse.badRequest('ID de tournoi invalide');

  try {
    const conflicts = await ConflictService.getUserPendingConflicts(session.userId, tournamentId);
    return ApiResponse.ok({ conflicts });
  } catch (err) {
    return ApiResponse.serverError(err);
  }
}
