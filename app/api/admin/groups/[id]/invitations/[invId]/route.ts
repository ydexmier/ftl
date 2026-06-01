import { NextRequest } from 'next/server';
import { requireAdminSession } from '@/src/lib/auth/getAuthSession';
import { GroupInvitationRepository } from '@/src/repositories/db/GroupInvitationRepository';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ id: string; invId: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  const result = await requireAdminSession(request);
  if ('error' in result) return result.error;

  const { id, invId } = await params;

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
