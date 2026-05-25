import { NextRequest } from 'next/server';
import { requireAdminSession } from '@/src/lib/auth/getAuthSession';
import { FeedbackRepository } from '@/src/repositories/db/FeedbackRepository';
import { ApiResponse } from '@/src/lib/api/responses';
import { validateAdminFeedbackStatus } from '@/src/lib/validation';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const result = await requireAdminSession(request);
  if ('error' in result) return result.error;

  const v = validateAdminFeedbackStatus(await request.json());
  if (!v.ok) return ApiResponse.badRequest(v.error);

  const { id } = await params;
  const updated = await FeedbackRepository.updateStatus(id, v.data.status);
  if (!updated) return ApiResponse.notFound('Feedback introuvable');

  return ApiResponse.ok(updated);
}
