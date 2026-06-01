import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { GroupInvitationRepository } from '@/src/repositories/db/GroupInvitationRepository';
import { UserRepository } from '@/src/repositories/db/UserRepository';

export async function GET(request: NextRequest) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const [groupInvitations, user] = await Promise.all([
    GroupInvitationRepository.countPendingByUser(auth.userId),
    UserRepository.findById(auth.userId),
  ]);

  return ApiResponse.ok({ groupInvitations, isGuest: user?.isGuest ?? false });
}
