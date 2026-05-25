import { NextRequest } from 'next/server';
import { requireAdminSession } from '@/src/lib/auth/getAuthSession';
import { GroupService } from '@/src/services/GroupService';
import { ApiResponse } from '@/src/lib/api/responses';
import type { GroupMemberRole } from '@/src/types/group';

type Params = { params: Promise<{ id: string; uid: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const result = await requireAdminSession(request);
  if ('error' in result) return result.error;

  try {
    const { id, uid } = await params;
    const { role } = await request.json();
    if (role !== 'ADMIN' && role !== 'MEMBER') {
      return ApiResponse.badRequest('Rôle invalide, valeurs acceptées : ADMIN, MEMBER');
    }
    const updated = await GroupService.adminUpdateMemberRole(id, uid, role as GroupMemberRole);
    return ApiResponse.ok(updated);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'NOT_FOUND') return ApiResponse.notFound('Groupe ou membre introuvable');
    return ApiResponse.badRequest(msg);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const result = await requireAdminSession(request);
  if ('error' in result) return result.error;

  try {
    const { id, uid } = await params;
    await GroupService.adminRemoveMember(id, uid);
    return ApiResponse.ok({ message: 'Membre retiré' });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'NOT_FOUND') return ApiResponse.notFound('Groupe ou membre introuvable');
    return ApiResponse.badRequest(msg);
  }
}
