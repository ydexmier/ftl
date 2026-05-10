import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupService } from '@/src/services/GroupService';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  try {
    const { id } = await params;
    const group = await GroupService.getGroupById(id, auth.userId);
    return ApiResponse.ok(group);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'NOT_FOUND') return ApiResponse.notFound('Groupe introuvable');
    if (msg === 'FORBIDDEN') return ApiResponse.forbidden();
    return ApiResponse.serverError(err);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  try {
    const { id } = await params;
    const data = await request.json();
    const group = await GroupService.updateGroup(id, auth.userId, data);
    return ApiResponse.ok(group);
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
    const { id } = await params;
    await GroupService.deleteGroup(id, auth.userId);
    return ApiResponse.ok({ success: true });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'FORBIDDEN') return ApiResponse.forbidden();
    return ApiResponse.badRequest(msg);
  }
}
