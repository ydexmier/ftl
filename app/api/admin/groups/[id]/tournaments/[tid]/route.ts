import { NextRequest } from 'next/server';
import { requireAdminSession } from '@/src/lib/auth/getAuthSession';
import { GroupService } from '@/src/services/GroupService';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ id: string; tid: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  const result = await requireAdminSession(request);
  if ('error' in result) return result.error;

  try {
    const { id, tid } = await params;
    await GroupService.adminRemoveTournament(id, Number(tid));
    return ApiResponse.ok({ message: 'Tournoi retiré du groupe' });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'NOT_FOUND') return ApiResponse.notFound('Groupe introuvable');
    return ApiResponse.serverError(err);
  }
}
