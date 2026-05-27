import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupService } from '@/src/services/GroupService';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ id: string; tid: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  try {
    const { id, tid } = await params;
    const accesses = await GroupService.getExternalAccessList(id, auth.userId, Number(tid));
    return ApiResponse.ok({ accesses });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'FORBIDDEN') return ApiResponse.forbidden();
    return ApiResponse.serverError(err);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  try {
    const { id, tid } = await params;
    const { email, expiresAt } = await request.json();
    if (!email) return ApiResponse.badRequest('email requis');

    const access = await GroupService.inviteExternal(
      id,
      auth.userId,
      email,
      Number(tid),
      expiresAt ? new Date(expiresAt) : undefined,
    );
    return ApiResponse.created(access);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'FORBIDDEN') return ApiResponse.forbidden();
    if (msg.includes('déjà')) return ApiResponse.conflict(msg);
    return ApiResponse.badRequest(msg);
  }
}
