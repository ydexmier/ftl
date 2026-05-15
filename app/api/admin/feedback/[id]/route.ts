import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { hasRole } from '@/src/lib/auth/rbac';
import { FeedbackRepository } from '@/src/repositories/db/FeedbackRepository';
import { ApiResponse } from '@/src/lib/api/responses';
import type { FeedbackStatus } from '@models/Feedback';

const VALID_STATUSES: FeedbackStatus[] = ['open', 'in-progress', 'done', 'closed'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuthSession(request);
  if (!session) return ApiResponse.unauthorized();
  if (!hasRole(session.role as never, 'ADMIN')) return ApiResponse.forbidden();

  const { id } = await params;
  const { status } = await request.json();

  if (!VALID_STATUSES.includes(status)) return ApiResponse.badRequest('Statut invalide');

  const updated = await FeedbackRepository.updateStatus(id, status);
  if (!updated) return ApiResponse.notFound('Feedback introuvable');

  return ApiResponse.ok(updated);
}
