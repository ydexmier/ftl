import { NextRequest } from 'next/server';
import { requireAdminSession } from '@/src/lib/auth/getAuthSession';
import { GroupService } from '@/src/services/GroupService';
import { ApiResponse } from '@/src/lib/api/responses';
import { validateAdminGroupBody } from '@/src/lib/validation';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const result = await requireAdminSession(request);
  if ('error' in result) return result.error;

  try {
    const { id } = await params;
    const group = await GroupService.adminGetGroupDetail(id);
    return ApiResponse.ok(group);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'NOT_FOUND') return ApiResponse.notFound('Groupe introuvable');
    return ApiResponse.serverError(err);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const result = await requireAdminSession(request);
  if ('error' in result) return result.error;
  const { session } = result;

  const v = validateAdminGroupBody(await request.json());
  if (!v.ok) return ApiResponse.badRequest(v.error);

  try {
    const { id } = await params;
    const updated = await GroupService.updateGroup(id, session.userId, v.data);
    return ApiResponse.ok(updated);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'FORBIDDEN') return ApiResponse.forbidden();
    return ApiResponse.badRequest(msg);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const result = await requireAdminSession(request);
  if ('error' in result) return result.error;

  try {
    const { id } = await params;
    await GroupService.adminDeleteGroup(id);
    return ApiResponse.ok({ message: 'Groupe supprimé' });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'NOT_FOUND') return ApiResponse.notFound('Groupe introuvable');
    if (msg === 'TOURNAMENT_ACTIVE') {
      return ApiResponse.conflict('Impossible de supprimer un groupe avec un tournoi en cours (attendre J+3 après le tournoi)');
    }
    return ApiResponse.serverError(err);
  }
}
