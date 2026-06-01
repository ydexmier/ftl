import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { GroupInvitationRepository } from '@/src/repositories/db/GroupInvitationRepository';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ id: string; invId: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const { id, invId } = await params;

  const isAdmin = await GroupRepository.isAdmin(id, auth.userId);
  if (!isAdmin) return ApiResponse.forbidden();

  const invitation = await GroupInvitationRepository.findById(invId);
  if (!invitation || String(invitation.groupId) !== id) {
    return ApiResponse.notFound('Invitation introuvable');
  }
  if (invitation.status !== 'PENDING') {
    return ApiResponse.badRequest('Cette invitation ne peut plus être annulée');
  }

  await GroupInvitationRepository.deleteById(invId);
  return ApiResponse.ok({ message: 'Invitation annulée' });
}
