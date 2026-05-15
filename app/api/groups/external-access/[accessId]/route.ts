import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupService } from '@/src/services/GroupService';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ accessId: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  try {
    const { accessId } = await params;
    const { status } = await request.json();
    if (status !== 'ACCEPTED' && status !== 'REJECTED') {
      return ApiResponse.badRequest('Statut invalide (ACCEPTED ou REJECTED)');
    }
    const result = await GroupService.respondToExternalAccess(accessId, auth.userId, status);
    return ApiResponse.ok(result);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'NOT_FOUND') return ApiResponse.notFound('Accès introuvable');
    if (msg === 'FORBIDDEN') return ApiResponse.forbidden();
    return ApiResponse.badRequest(msg);
  }
}
