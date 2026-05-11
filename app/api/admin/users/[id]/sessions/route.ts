import { NextRequest } from 'next/server';
import UserModel from '@models/User';
import SessionModel from '@models/Session';
import AuditLogModel from '@models/AuditLog';
import { getAdminSession } from '@/src/lib/auth/getAdminSession';
import { ApiResponse } from '@/src/lib/api/responses';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAdminSession(request);
  if (!auth) return ApiResponse.unauthorized();
  const { session } = auth;

  const { id } = await params;
  const user = await UserModel.findById(id).select('username').lean();
  if (!user) return ApiResponse.notFound('Utilisateur introuvable');

  await SessionModel.deleteMany({ userId: user._id });

  const adminUser = await UserModel.findById(session.userId).select('username').lean();
  await AuditLogModel.create({
    action: 'ADMIN_ACTION',
    userId: session.userId,
    username: adminUser?.username ?? '',
    metadata: { action: 'REVOKE_SESSIONS', targetUserId: id, targetUsername: user.username },
  });

  return ApiResponse.noContent();
}
