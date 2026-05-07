import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToMongoDB from '@/src/lib/db';
import UserModel from '@models/User';
import SessionModel from '@models/Session';
import AuditLogModel from '@models/AuditLog';
import { getSession } from '@/src/lib/auth/session';
import { verifyCookie } from '@/src/lib/auth/cookieSign';
import { hasRole } from '@/src/lib/auth/rbac';
import type { UserRole } from '@models/User';

async function getAdminSession(request: NextRequest) {
  const val = request.cookies.get('session')?.value;
  if (!val) return null;
  const parsed = await verifyCookie(val);
  if (!parsed || !hasRole(parsed.role as UserRole, 'ADMIN')) return null;
  await connectToMongoDB();
  const session = await getSession(parsed.sessionId);
  return session;
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession(request);
  if (!session) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 404 });
  }

  const user = await UserModel.findById(id);
  if (!user) return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });

  await SessionModel.deleteMany({ userId: id });

  await AuditLogModel.create({
    action: 'ADMIN_ACTION',
    userId: session.userId,
    username: session.userId.toString(),
    metadata: { action: 'REVOKE_SESSIONS', targetUserId: id },
  });

  return new NextResponse(null, { status: 204 });
}
