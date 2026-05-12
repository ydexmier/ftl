import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { hasRole } from '@/src/lib/auth/rbac';
import { FeedbackRepository } from '@/src/repositories/db/FeedbackRepository';
import { ApiResponse } from '@/src/lib/api/responses';
import type { FeedbackStatus } from '@models/Feedback';

export async function GET(request: NextRequest) {
  const session = await getAuthSession(request);
  if (!session) return ApiResponse.unauthorized();
  if (!hasRole(session.role as never, 'ADMIN')) return ApiResponse.forbidden();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = 50;
  const status = searchParams.get('status') as FeedbackStatus | null;

  const { feedbacks, total } = await FeedbackRepository.findAll(page, limit, status ?? undefined);

  return ApiResponse.ok({
    feedbacks,
    total,
    pages: Math.ceil(total / limit),
  });
}
