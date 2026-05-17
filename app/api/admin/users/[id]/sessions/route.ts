import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { hasRole } from '@/src/lib/auth/rbac';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { AuditLogRepository } from '@/src/repositories/db/AuditLogRepository';
import { SessionRepository } from '@/src/repositories/db/SessionRepository';
import { ApiResponse } from '@/src/lib/api/responses';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();
  if (!hasRole(auth.role as never, 'ADMIN')) return ApiResponse.forbidden();

  const { id } = await params;
  const user = await UserRepository.findById(id);
  if (!user) return ApiResponse.notFound('Utilisateur introuvable');

  const sessions = await SessionRepository.findByUserId(id);
  return ApiResponse.ok({ sessions });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();
  if (!hasRole(auth.role as never, 'ADMIN')) return ApiResponse.forbidden();

  const { id } = await params;
  const user = await UserRepository.findById(id);
  if (!user) return ApiResponse.notFound('Utilisateur introuvable');

  await SessionRepository.deleteByUserId(id);

  const adminUser = await UserRepository.findById(auth.userId);
  await AuditLogRepository.create({
    action: 'ADMIN_ACTION',
    userId: auth.userId,
    username: adminUser?.username ?? '',
    metadata: { action: 'REVOKE_SESSIONS', targetUserId: id, targetUsername: user.username },
  });

  return ApiResponse.noContent();
}
