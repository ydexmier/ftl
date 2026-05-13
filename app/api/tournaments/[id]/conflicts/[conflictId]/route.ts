import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { ConflictService } from '@/src/services/ConflictService';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; conflictId: string }> },
) {
  const session = await getAuthSession(req);
  if (!session) return ApiResponse.unauthorized();

  const { conflictId } = await params;
  const body = await req.json().catch(() => ({}));
  const { status } = body as { status?: string };

  if (status !== 'PENDING_ADMIN' && status !== 'UNCERTAINTY') {
    return ApiResponse.badRequest('Statut invalide. Valeurs acceptées : PENDING_ADMIN, UNCERTAINTY');
  }

  try {
    const conflict = await ConflictService.resolveMemberConflict(conflictId, session.userId, status);
    return ApiResponse.ok(conflict);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'NOT_FOUND') return ApiResponse.notFound('Conflit introuvable');
      if (err.message === 'FORBIDDEN') return ApiResponse.forbidden();
      return ApiResponse.badRequest(err.message);
    }
    return ApiResponse.serverError(err);
  }
}
