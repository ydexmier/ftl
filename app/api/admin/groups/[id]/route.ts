import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupService } from '@/src/services/GroupService';
import { hasRole } from '@/src/lib/auth/rbac';
import { ApiResponse } from '@/src/lib/api/responses';
import { validateAdminGroupBody } from '@/src/lib/validation';

type Params = { params: Promise<{ id: string }> };

async function getAdminAuth(request: NextRequest) {
  const auth = await getAuthSession(request);
  if (!auth) return { auth: null, error: ApiResponse.unauthorized() };
  if (!hasRole(auth.role as 'USER' | 'ADMIN' | 'SUPERUSER', 'ADMIN')) return { auth: null, error: ApiResponse.forbidden() };
  return { auth, error: null };
}

export async function GET(request: NextRequest, { params }: Params) {
  const { auth, error } = await getAdminAuth(request);
  if (!auth) return error!;

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
  const { auth, error } = await getAdminAuth(request);
  if (!auth) return error!;

  const v = validateAdminGroupBody(await request.json());
  if (!v.ok) return ApiResponse.badRequest(v.error);

  try {
    const { id } = await params;
    const updated = await GroupService.updateGroup(id, auth.userId, v.data);
    return ApiResponse.ok(updated);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'FORBIDDEN') return ApiResponse.forbidden();
    return ApiResponse.badRequest(msg);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { auth, error } = await getAdminAuth(request);
  if (!auth) return error!;

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
