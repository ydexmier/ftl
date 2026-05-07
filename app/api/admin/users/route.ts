import { NextRequest, NextResponse } from 'next/server';
import connectToMongoDB from '@/src/lib/db';
import UserModel from '@models/User';
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

export async function GET(request: NextRequest) {
  const auth = await getAdminSession(request);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 25));
  const search = searchParams.get('search')?.trim() || '';
  const role = searchParams.get('role') || '';

  const query: Record<string, unknown> = {};
  if (search) {
    query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (role) query.role = role;

  const [users, total] = await Promise.all([
    UserModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-passwordHash')
      .lean(),
    UserModel.countDocuments(query),
  ]);

  return NextResponse.json({
    users: users.map((u) => ({ ...u, _id: String(u._id) })),
    total,
    pages: Math.ceil(total / limit),
    page,
  });
}

export async function POST(request: NextRequest) {
  const auth = await getAdminSession(request);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { username, email, password, role = 'USER' } = await request.json();

  const check = validatePasswordStrength(password ?? '');
  if (!check.valid) return NextResponse.json({ error: check.message }, { status: 400 });

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
  }

  if (await UserModel.findOne({ username: username?.toLowerCase() })) {
    return NextResponse.json({ error: 'Ce nom d\'utilisateur est déjà pris' }, { status: 409 });
  }
  if (await UserModel.findOne({ email: email?.toLowerCase() })) {
    return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await UserModel.create({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    passwordHash,
    role,
  });

  const adminUser = await UserModel.findById(auth.session.userId).select('username').lean();
  await AuditLogModel.create({
    action: 'USER_CREATED',
    userId: auth.session.userId,
    username: adminUser?.username ?? '',
    metadata: { createdUsername: username, createdRole: role },
  });

  return NextResponse.json(
    { id: String(user._id), username: user.username, email: user.email, role: user.role },
    { status: 201 },
  );
}
