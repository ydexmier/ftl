import { NextRequest } from 'next/server';
import { requireAdminSession } from '@/src/lib/auth/getAuthSession';
import { FeedbackRepository } from '@/src/repositories/db/FeedbackRepository';
import { ApiResponse } from '@/src/lib/api/responses';
import type { FeedbackStatus } from '@models/Feedback';

export async function GET(request: NextRequest) {
  const result = await requireAdminSession(request);
  if ('error' in result) return result.error;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = 50;
  const status = searchParams.get('status') as FeedbackStatus | null;

  const { feedbacks, total } = await FeedbackRepository.findWithFilters(page, limit, status ?? undefined);

  return ApiResponse.ok({
    feedbacks,
    total,
    pages: Math.ceil(total / limit),
  });
}
