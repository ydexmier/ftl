import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { ConflictService } from '@/src/services/ConflictService';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ id: string; conflictId: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getAuthSession(request);
  if (!session) return ApiResponse.unauthorized();

  const { id: groupId, conflictId } = await params;

  const isAdmin = await GroupRepository.isAdmin(groupId, session.userId);
  if (!isAdmin) return ApiResponse.forbidden();

  try {
    await ConflictService.dismissUncertainty(conflictId, groupId);
    return ApiResponse.ok({ success: true });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'NOT_FOUND') return ApiResponse.notFound('Incertitude introuvable');
    if (msg === 'FORBIDDEN') return ApiResponse.forbidden();
    return ApiResponse.badRequest(msg);
  }
}
