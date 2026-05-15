import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupService } from '@/src/services/GroupService';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ id: string; tid: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  try {
    const { id, tid } = await params;
    const body = await request.json();
    const { status } = body as { status: unknown };
    if (status !== 'ACTIVE' && status !== 'ARCHIVED') {
      return ApiResponse.badRequest('Statut invalide, valeurs acceptées : ACTIVE, ARCHIVED');
    }

    const updated = await GroupService.archiveGroupTournament(id, auth.userId, Number(tid), status);
    return ApiResponse.ok(updated);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'FORBIDDEN') return ApiResponse.forbidden();
    return ApiResponse.badRequest(msg);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  try {
    const { id, tid } = await params;
    await GroupService.removeTournament(id, auth.userId, Number(tid));
    return ApiResponse.ok({ success: true });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'FORBIDDEN') return ApiResponse.forbidden();
    return ApiResponse.badRequest(msg);
  }
}
