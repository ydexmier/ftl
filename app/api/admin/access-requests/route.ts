import { NextRequest } from 'next/server';
import { requireAdminSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { AccessRequestRepository } from '@/src/repositories/db/AccessRequestRepository';

export async function GET(req: NextRequest) {
  const result = await requireAdminSession(req);
  if ('error' in result) return result.error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 25));
  const status = searchParams.get('status') || '';

  const { requests, total } = await AccessRequestRepository.findWithFilters(status, page, limit);

  return ApiResponse.ok({
    requests: requests.map((r) => ({
      _id: String(r._id),
      email: r.email,
      reason: r.reason ?? null,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      reviewedAt: r.reviewedAt?.toISOString() ?? null,
    })),
    total,
    pages: Math.ceil(total / limit),
    page,
  });
}
