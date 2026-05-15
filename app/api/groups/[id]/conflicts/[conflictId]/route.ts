import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { ConflictService } from '@/src/services/ConflictService';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; conflictId: string }> },
) {
  const session = await getAuthSession(req);
  if (!session) return ApiResponse.unauthorized();

  const { id: groupId, conflictId } = await params;

  const isAdmin = await GroupRepository.isAdmin(groupId, session.userId);
  if (!isAdmin) return ApiResponse.forbidden();

  const body = await req.json().catch(() => ({}));
  const { decision } = body as { decision?: string };

  if (decision !== 'APPROVED' && decision !== 'REJECTED') {
    return ApiResponse.badRequest('Décision invalide. Valeurs acceptées : APPROVED, REJECTED');
  }

  try {
    const conflict = await ConflictService.resolveAdminConflict(conflictId, session.userId, decision);
    return ApiResponse.ok(conflict);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'NOT_FOUND') return ApiResponse.notFound('Conflit introuvable');
      return ApiResponse.badRequest(err.message);
    }
    return ApiResponse.serverError(err);
  }
}
