import { NextRequest } from 'next/server';
import { requireAdminSession } from '@/src/lib/auth/getAuthSession';
import { AuditLogRepository } from '@/src/repositories/db/AuditLogRepository';
import { AccessRequestRepository } from '@/src/repositories/db/AccessRequestRepository';
import { ApiResponse } from '@/src/lib/api/responses';

export async function GET(request: NextRequest) {
  const result = await requireAdminSession(request);
  if ('error' in result) return result.error;

  const [stats, pendingAccessRequests] = await Promise.all([
    AuditLogRepository.getStats(),
    AccessRequestRepository.countPending(),
  ]);

  return ApiResponse.ok({ ...stats, pendingAccessRequests });
}
