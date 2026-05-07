import { NextRequest, NextResponse } from 'next/server';
import connectToMongoDB from '@/src/lib/db';
import UserModel from '@models/User';
import SessionModel from '@models/Session';
import AuditLogModel from '@models/AuditLog';
import { hashPassword, validatePasswordStrength } from '@/src/lib/auth/password';
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
  if (!session) return null;
  return { parsed, session };
}

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await getAdminSession(request);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = await params;
  const user = await UserModel.findById(id).select('-passwordHash').lean();
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

  const [activeSessions, recentLogs] = await Promise.all([
    SessionModel.countDocuments({ userId: user._id, expiresAt: { $gt: new Date() } }),
    AuditLogModel.find({ userId: user._id })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean(),
  ]);

  return NextResponse.json({
    user: { ...user, _id: String(user._id) },
    activeSessions,
    recentLogs: recentLogs.map((l) => ({ ...l, _id: String(l._id), userId: String(l.userId) })),
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await getAdminSession(request);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = await params;
  const user = await UserModel.findById(id);
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

  const body = await request.json();
  const { username, email, role, password } = body;
  const updates: Record<string, unknown> = {};

  if (username !== undefined) {
    const existing = await UserModel.findOne({ username: username.toLowerCase(), _id: { $ne: id } });
    if (existing) return NextResponse.json({ error: 'Ce nom d\'utilisateur est déjà pris' }, { status: 409 });
    updates.username = username.toLowerCase();
  }

  if (email !== undefined) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }
    const existing = await UserModel.findOne({ email: email.toLowerCase(), _id: { $ne: id } });
    if (existing) return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 });
    updates.email = email.toLowerCase();
  }

  if (role !== undefined) updates.role = role;

  const adminUser = await UserModel.findById(auth.session.userId).select('username').lean();
  const adminUsername = adminUser?.username ?? '';

  if (password) {
    const check = validatePasswordStrength(password);
    if (!check.valid) return NextResponse.json({ error: check.message }, { status: 400 });
    updates.passwordHash = await hashPassword(password);
    await AuditLogModel.create({
      action: 'PASSWORD_CHANGED',
      userId: auth.session.userId,
      username: adminUsername,
      metadata: { targetUserId: id, targetUsername: user.username },
    });
  }

  Object.assign(user, updates);
  await user.save();

  await AuditLogModel.create({
    action: 'USER_UPDATED',
    userId: auth.session.userId,
    username: adminUsername,
    metadata: { targetUserId: id, targetUsername: user.username, fields: Object.keys(updates).filter((k) => k !== 'passwordHash') },
  });

  return NextResponse.json({
    user: { _id: String(user._id), username: user.username, email: user.email, role: user.role },
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await getAdminSession(request);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = await params;

  if (String(auth.session.userId) === id) {
    return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte' }, { status: 400 });
  }

  const user = await UserModel.findById(id);
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

  const adminUser = await UserModel.findById(auth.session.userId).select('username').lean();

  await Promise.all([
    user.deleteOne(),
    SessionModel.deleteMany({ userId: user._id }),
  ]);

  await AuditLogModel.create({
    action: 'USER_DELETED',
    userId: auth.session.userId,
    username: adminUser?.username ?? '',
    metadata: { deletedUserId: id, deletedUsername: user.username },
  });

  return new NextResponse(null, { status: 204 });
}
