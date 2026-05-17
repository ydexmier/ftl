import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupService } from '@/src/services/GroupService';
import { hasRole } from '@/src/lib/auth/rbac';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ id: string }> };

async function getAdminAuth(request: NextRequest) {
  const auth = await getAuthSession(request);
  if (!auth) return { auth: null, error: ApiResponse.unauthorized() };
  if (!hasRole(auth.role as 'USER' | 'ADMIN' | 'SUPERUSER', 'ADMIN')) return { auth: null, error: ApiResponse.forbidden() };
  return { auth, error: null };
}

export async function POST(request: NextRequest, { params }: Params) {
  const { auth, error } = await getAdminAuth(request);
  if (!auth) return error!;

  try {
    const { id } = await params;
    const { userId } = await request.json();
    if (!userId) return ApiResponse.badRequest('userId requis');

    const invitation = await GroupService.adminInviteMember(id, auth.userId, userId);
    return ApiResponse.created(invitation);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'NOT_FOUND') return ApiResponse.notFound('Groupe ou utilisateur introuvable');
    return ApiResponse.badRequest(msg);
  }
}
