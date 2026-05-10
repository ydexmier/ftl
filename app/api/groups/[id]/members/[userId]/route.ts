import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupService } from '@/src/services/GroupService';
import type { GroupMemberRole } from '@/src/types/group';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ id: string; userId: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  try {
    const { id, userId } = await params;
    await GroupService.removeMember(id, auth.userId, userId);
    return ApiResponse.ok({ success: true });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'FORBIDDEN') return ApiResponse.forbidden();
    return ApiResponse.badRequest(msg);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  try {
    const { id, userId } = await params;
    const { role } = await request.json();
    if (role !== 'MEMBER' && role !== 'ADMIN') {
      return ApiResponse.badRequest('Rôle invalide (MEMBER ou ADMIN)');
    }
    const group = await GroupService.updateMemberRole(id, auth.userId, userId, role as GroupMemberRole);
    return ApiResponse.ok(group);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'FORBIDDEN') return ApiResponse.forbidden();
    return ApiResponse.badRequest(msg);
  }
}
