import { NextRequest } from 'next/server';
import { requireAdminSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { InvitationRepository } from '@/src/repositories/db/InvitationRepository';
import { AccessRequestRepository } from '@/src/repositories/db/AccessRequestRepository';

export async function GET(request: NextRequest) {
  const result = await requireAdminSession(request);
  if ('error' in result) return result.error;

  const [invitations, accessRequests] = await Promise.all([
    InvitationRepository.countPending(),
    AccessRequestRepository.countPending(),
  ]);

  return ApiResponse.ok({ invitations, accessRequests });
}
