import { NextRequest } from 'next/server';
import { getAdminSession } from '@/src/lib/auth/getAdminSession';
import { AuditLogRepository } from '@/src/repositories/db/AuditLogRepository';
import { ApiResponse } from '@/src/lib/api/responses';

export async function GET(request: NextRequest) {
  const auth = await getAdminSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const stats = await AuditLogRepository.getStats();
  return ApiResponse.ok(stats);
}
