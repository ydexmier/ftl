import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { hasRole } from '@/src/lib/auth/rbac';
import { FeedbackRepository } from '@/src/repositories/db/FeedbackRepository';
import { ApiResponse } from '@/src/lib/api/responses';
import { validateAdminFeedbackStatus } from '@/src/lib/validation';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuthSession(request);
  if (!session) return ApiResponse.unauthorized();
  if (!hasRole(session.role as never, 'ADMIN')) return ApiResponse.forbidden();

  const v = validateAdminFeedbackStatus(await request.json());
  if (!v.ok) return ApiResponse.badRequest(v.error);

  const { id } = await params;
  const updated = await FeedbackRepository.updateStatus(id, v.data.status);
  if (!updated) return ApiResponse.notFound('Feedback introuvable');

  return ApiResponse.ok(updated);
}
