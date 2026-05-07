import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToMongoDB from '@/src/lib/db';
import UserModel from '@models/User';
import SessionModel from '@models/Session';
import AuditLogModel from '@models/AuditLog';
import { hashPassword, validatePasswordStrength } from '@/src/lib/auth/password';
import { getSession } from '@/src/lib/auth/session';
import { verifyCookie } from '@/src/lib/auth/cookieSign';
import { hasRole } from '@/src/lib/auth/rbac';
import type { UserRole } from '@models/User';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function getAdminSession(request: NextRequest) {
  const val = request.cookies.get('session')?.value;
  if (!val) return null;
  const parsed = await verifyCookie(val);
  if (!parsed || !hasRole(parsed.role as UserRole, 'ADMIN')) return null;
  await connectToMongoDB();
  const session = await getSession(parsed.sessionId);
  return session;
}

function isValidObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession(request);
  if (!session) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: 'ID invalide' }, { status: 404 });

  const user = await UserModel.findById(id).select('-passwordHash').lean();
  if (!user) return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });

  const now = new Date();
  const [activeSessions, recentLogs] = await Promise.all([
    SessionModel.countDocuments({ userId: user._id, expiresAt: { $gt: now } }),
    AuditLogModel.find({ userId: user._id }).sort({ timestamp: -1 }).limit(20).lean(),
  ]);

  return NextResponse.json({ user, activeSessions, recentLogs });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession(request);
  if (!session) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: 'ID invalide' }, { status: 404 });

  const user = await UserModel.findById(id);
  if (!user) return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });

  const body = await request.json();
  const { username, email, role, password } = body;
  const updatedFields: string[] = [];
  const updates: Record<string, unknown> = {};

  if (email !== undefined) {
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }
    const existing = await UserModel.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
    if (existing) return NextResponse.json({ error: 'Email deja utilise' }, { status: 409 });
    updates.email = email.toLowerCase();
    updatedFields.push('email');
  }

  if (username !== undefined) {
    const existing = await UserModel.findOne({ username: username.toLowerCase(), _id: { $ne: user._id } });
    if (existing) return NextResponse.json({ error: 'Username deja pris' }, { status: 409 });
    updates.username = username.toLowerCase();
    updatedFields.push('username');
  }

  if (role !== undefined) {
    updates.role = role;
    updatedFields.push('role');
  }

  if (password !== undefined) {
    const check = validatePasswordStrength(password);
    if (!check.valid) return NextResponse.json({ error: check.message }, { status: 400 });
    updates.passwordHash = await hashPassword(password);
    updatedFields.push('password');
  }

  await UserModel.updateOne({ _id: user._id }, { $set: updates });

  if (updatedFields.includes('password')) {
    await AuditLogModel.create({
      action: 'PASSWORD_CHANGED',
      userId: session.userId,
      username: session.userId.toString(),
      metadata: { targetUserId: id },
    });
  }

  await AuditLogModel.create({
    action: 'USER_UPDATED',
    userId: session.userId,
    username: session.userId.toString(),
    metadata: { targetUserId: id, updatedFields },
  });

  const updated = await UserModel.findById(id).select('-passwordHash').lean();
  return NextResponse.json({ user: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession(request);
  if (!session) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: 'ID invalide' }, { status: 404 });

  if (session.userId.toString() === id) {
    return NextResponse.json({ error: 'Impossible de supprimer son propre compte' }, { status: 400 });
  }

  const user = await UserModel.findById(id);
  if (!user) return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });

  await Promise.all([
    UserModel.deleteOne({ _id: id }),
    SessionModel.deleteMany({ userId: id }),
  ]);

  await AuditLogModel.create({
    action: 'USER_DELETED',
    userId: session.userId,
    username: session.userId.toString(),
    metadata: { deletedUserId: id, deletedUsername: user.username },
  });

  return new NextResponse(null, { status: 204 });
}
