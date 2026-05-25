import { NextRequest } from 'next/server';
import { requireAdminSession } from '@/src/lib/auth/getAuthSession';
import { GroupService } from '@/src/services/GroupService';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const result = await requireAdminSession(request);
  if ('error' in result) return result.error;
  const { session } = result;

  try {
    const { id } = await params;
    const { userId } = await request.json();
    if (!userId) return ApiResponse.badRequest('userId requis');

    const invitation = await GroupService.adminInviteMember(id, session.userId, userId);
    return ApiResponse.created(invitation);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'NOT_FOUND') return ApiResponse.notFound('Groupe ou utilisateur introuvable');
    return ApiResponse.badRequest(msg);
  }
}
