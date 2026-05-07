import { NextRequest, NextResponse } from 'next/server';
import connectToMongoDB from '@/src/lib/db';
import UserModel from '@models/User';
import SessionModel from '@models/Session';
import AuditLogModel from '@models/AuditLog';
import { getSession } from '@/src/lib/auth/session';
import { verifyCookie } from '@/src/lib/auth/cookieSign';
import { hasRole } from '@/src/lib/auth/rbac';
import type { UserRole } from '@models/User';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const val = request.cookies.get('session')?.value;
  if (!val) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const parsed = await verifyCookie(val);
  if (!parsed || !hasRole(parsed.role as UserRole, 'ADMIN')) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  await connectToMongoDB();
  const session = await getSession(parsed.sessionId);
  if (!session) return NextResponse.json({ error: 'Session expirée' }, { status: 401 });

  const { id } = await params;
  const user = await UserModel.findById(id).select('username').lean();
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

  await SessionModel.deleteMany({ userId: user._id });

  const adminUser = await UserModel.findById(session.userId).select('username').lean();
  await AuditLogModel.create({
    action: 'ADMIN_ACTION',
    userId: session.userId,
    username: adminUser?.username ?? '',
    metadata: { action: 'REVOKE_SESSIONS', targetUserId: id, targetUsername: user.username },
  });

  return new NextResponse(null, { status: 204 });
}
