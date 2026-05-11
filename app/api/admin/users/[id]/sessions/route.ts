import { NextRequest } from 'next/server';
import { getAdminSession } from '@/src/lib/auth/getAdminSession';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { AuditLogRepository } from '@/src/repositories/db/AuditLogRepository';
import { SessionRepository } from '@/src/repositories/db/SessionRepository';
import { ApiResponse } from '@/src/lib/api/responses';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAdminSession(request);
  if (!auth) return ApiResponse.unauthorized();
  const { session } = auth;

  const { id } = await params;
  const user = await UserRepository.findById(id);
  if (!user) return ApiResponse.notFound('Utilisateur introuvable');

  await SessionRepository.deleteByUserId(id);

  const adminUser = await UserRepository.findById(String(session.userId));
  await AuditLogRepository.create({
    action: 'ADMIN_ACTION',
    userId: session.userId,
    username: adminUser?.username ?? '',
    metadata: { action: 'REVOKE_SESSIONS', targetUserId: id, targetUsername: user.username },
  });

  return ApiResponse.noContent();
}
