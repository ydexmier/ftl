import { NextRequest, NextResponse } from 'next/server';
import connectToMongoDB from '@/src/lib/db';
import UserModel from '@models/User';
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

export async function GET(request: NextRequest) {
  const session = await getAdminSession(request);
  if (!session) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
  const search = searchParams.get('search') ?? '';
  const role = searchParams.get('role') ?? '';

  const filter: Record<string, unknown> = {};
  if (search) {
    filter.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (role) filter.role = role;

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    UserModel.find(filter).select('-passwordHash').skip(skip).limit(limit).lean(),
    UserModel.countDocuments(filter),
  ]);

  return NextResponse.json({ users, total, page, limit });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession(request);
  if (!session) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { username, email, password, role = 'USER' } = await request.json();

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
  }

  const check = validatePasswordStrength(password ?? '');
  if (!check.valid) return NextResponse.json({ error: check.message }, { status: 400 });

  if (await UserModel.findOne({ username: username?.toLowerCase() })) {
    return NextResponse.json({ error: 'Username deja pris' }, { status: 409 });
  }
  if (await UserModel.findOne({ email: email?.toLowerCase() })) {
    return NextResponse.json({ error: 'Email deja utilise' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await UserModel.create({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    passwordHash,
    role,
  });

  await AuditLogModel.create({
    action: 'USER_CREATED',
    userId: session.userId,
    username: session.userId.toString(),
    metadata: { createdUserId: String(user._id), createdRole: role },
  });

  return NextResponse.json({ id: String(user._id), username: user.username, email: user.email, role: user.role }, { status: 201 });
}
