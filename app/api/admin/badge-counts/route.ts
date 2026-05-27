import { NextRequest } from 'next/server';
import { requireAdminSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { InvitationRepository } from '@/src/repositories/db/InvitationRepository';
import { AccessRequestRepository } from '@/src/repositories/db/AccessRequestRepository';
import { FeedbackRepository } from '@/src/repositories/db/FeedbackRepository';

export async function GET(request: NextRequest) {
  const result = await requireAdminSession(request);
  if ('error' in result) return result.error;

  const [invitations, accessRequests, feedback] = await Promise.all([
    InvitationRepository.countPending(),
    AccessRequestRepository.countPending(),
    FeedbackRepository.countOpen(),
  ]);

  return ApiResponse.ok({ invitations, accessRequests, feedback });
}
