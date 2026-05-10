import { NextRequest } from 'next/server';
import connectToMongoDB from '@/src/lib/db';
import UserModel from '@models/User';
import SessionModel from '@models/Session';
import AuditLogModel from '@models/AuditLog';
import { getSession } from '@/src/lib/auth/session';
import { verifyCookie } from '@/src/lib/auth/cookieSign';
import { hasRole } from '@/src/lib/auth/rbac';
import type { UserRole } from '@models/User';
import { ApiResponse } from '@/src/lib/api/responses';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const val = request.cookies.get('session')?.value;
  if (!val) return ApiResponse.unauthorized();
  const parsed = await verifyCookie(val);
  if (!parsed || !hasRole(parsed.role as UserRole, 'ADMIN')) return ApiResponse.unauthorized();

  await connectToMongoDB();
  const session = await getSession(parsed.sessionId);
  if (!session) return ApiResponse.unauthorized('Session expirée');

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
