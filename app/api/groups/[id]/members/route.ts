import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupService } from '@/src/services/GroupService';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  try {
    const { id } = await params;
    const { userId } = await request.json();
    if (!userId) return ApiResponse.badRequest('userId requis');

    const invitation = await GroupService.inviteMember(id, auth.userId, userId);
    return ApiResponse.created(invitation);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'FORBIDDEN') return ApiResponse.forbidden();
    return ApiResponse.badRequest(msg);
  }
}
