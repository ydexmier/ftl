import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { GroupInvitationRepository } from '@/src/repositories/db/GroupInvitationRepository';

export async function GET(request: NextRequest) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const groupInvitations = await GroupInvitationRepository.countPendingByUser(auth.userId);

  return ApiResponse.ok({ groupInvitations });
}
