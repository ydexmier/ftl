import { NextRequest } from 'next/server';
import { requireAdminSession } from '@/src/lib/auth/getAuthSession';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { AuditLogRepository } from '@/src/repositories/db/AuditLogRepository';
import { SessionRepository } from '@/src/repositories/db/SessionRepository';
import { ApiResponse } from '@/src/lib/api/responses';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireAdminSession(request);
  if ('error' in result) return result.error;

  const { id } = await params;
  const user = await UserRepository.findById(id);
  if (!user) return ApiResponse.notFound('Utilisateur introuvable');

  const sessions = await SessionRepository.findByUserId(id);
  return ApiResponse.ok({ sessions });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireAdminSession(request);
  if ('error' in result) return result.error;
  const { session } = result;

  const { id } = await params;
  const user = await UserRepository.findById(id);
  if (!user) return ApiResponse.notFound('Utilisateur introuvable');

  await SessionRepository.deleteByUserId(id);

  const adminUser = await UserRepository.findById(session.userId);
  await AuditLogRepository.create({
    action: 'ADMIN_ACTION',
    userId: session.userId,
    username: adminUser?.username ?? '',
    metadata: { action: 'REVOKE_SESSIONS', targetUserId: id, targetUsername: user.username },
  });

  return ApiResponse.noContent();
}
