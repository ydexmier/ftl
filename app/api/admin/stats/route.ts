import { NextRequest } from 'next/server';
import { getAdminSession } from '@/src/lib/auth/getAdminSession';
import { AuditLogRepository } from '@/src/repositories/db/AuditLogRepository';
import { AccessRequestRepository } from '@/src/repositories/db/AccessRequestRepository';
import { ApiResponse } from '@/src/lib/api/responses';

export async function GET(request: NextRequest) {
  const auth = await getAdminSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const [stats, pendingAccessRequests] = await Promise.all([
    AuditLogRepository.getStats(),
    AccessRequestRepository.countPending(),
  ]);

  return ApiResponse.ok({ ...stats, pendingAccessRequests });
}
