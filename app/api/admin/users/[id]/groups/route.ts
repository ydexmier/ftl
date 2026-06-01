import { NextRequest } from 'next/server';
import { requireAdminSession } from '@/src/lib/auth/getAuthSession';
import { GroupService } from '@/src/services/GroupService';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const result = await requireAdminSession(request);
  if ('error' in result) return result.error;

  try {
    const { id } = await params;
    const { groupId } = await request.json();
    if (!groupId) return ApiResponse.badRequest('groupId requis');

    await GroupService.adminAddDirectMember(groupId, result.session.userId, id);
    return ApiResponse.created({ message: 'Membre ajouté au groupe' });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'NOT_FOUND') return ApiResponse.notFound('Groupe introuvable');
    return ApiResponse.badRequest(msg);
  }
}
