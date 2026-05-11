import { NextRequest } from 'next/server';
import SessionModel from '@models/Session';
import AuditLogModel from '@models/AuditLog';
import { getAdminSession } from '@/src/lib/auth/getAdminSession';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { ApiResponse } from '@/src/lib/api/responses';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAdminSession(request);
  if (!auth) return ApiResponse.unauthorized();
  const { session } = auth;

  const { id } = await params;
  const user = await UserRepository.findById(id);
  if (!user) return ApiResponse.notFound('Utilisateur introuvable');

  await SessionModel.deleteMany({ userId: user._id });

  const adminUser = await UserRepository.findById(String(session.userId));
  await AuditLogModel.create({
    action: 'ADMIN_ACTION',
    userId: session.userId,
    username: adminUser?.username ?? '',
    metadata: { action: 'REVOKE_SESSIONS', targetUserId: id, targetUsername: user.username },
  });

  return ApiResponse.noContent();
}
