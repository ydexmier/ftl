import { NextRequest } from 'next/server';
import { requireAdminSession } from '@/src/lib/auth/getAuthSession';
import { AuditLogRepository } from '@/src/repositories/db/AuditLogRepository';
import { ApiResponse } from '@/src/lib/api/responses';

export async function GET(request: NextRequest) {
  const result = await requireAdminSession(request);
  if ('error' in result) return result.error;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50')));

  const filter = {
    action: searchParams.get('action') ?? undefined,
    username: searchParams.get('username') ?? undefined,
    ip: searchParams.get('ip') ?? undefined,
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
  };

  const { logs, total } = await AuditLogRepository.findWithFilters(filter, page, limit);

  return ApiResponse.ok({ logs, total, page, pages: Math.ceil(total / limit) });
}
