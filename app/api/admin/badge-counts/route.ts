import { NextRequest } from 'next/server';
import { getAdminSession } from '@/src/lib/auth/getAdminSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { InvitationRepository } from '@/src/repositories/db/InvitationRepository';
import { AccessRequestRepository } from '@/src/repositories/db/AccessRequestRepository';
import { FeedbackRepository } from '@/src/repositories/db/FeedbackRepository';

export async function GET(request: NextRequest) {
  const auth = await getAdminSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const [invitations, accessRequests, feedback] = await Promise.all([
    InvitationRepository.countPending(),
    AccessRequestRepository.countPending(),
    FeedbackRepository.countOpen(),
  ]);

  return ApiResponse.ok({ invitations, accessRequests, feedback });
}
