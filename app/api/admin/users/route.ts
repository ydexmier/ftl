import { NextRequest, NextResponse } from 'next/server';
import connectToMongoDB from '@/src/lib/db';
import UserModel from '@models/User';
import AuditLogModel from '@models/AuditLog';
import { hashPassword, validatePasswordStrength } from '@/src/lib/auth/password';
import { getSession } from '@/src/lib/auth/session';
import { verifyCookie } from '@/src/lib/auth/cookieSign';
import { hasRole } from '@/src/lib/auth/rbac';
import type { UserRole } from '@models/User';

export async function POST(request: NextRequest) {
  const val = request.cookies.get('session')?.value;
  if (!val) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const parsed = await verifyCookie(val);
  if (!parsed || !hasRole(parsed.role as UserRole, 'ADMIN')) {
    return NextResponse.json({ error: 'Interdit' }, { status: 403 });
  }

  await connectToMongoDB();
  const session = await getSession(parsed.sessionId);
  if (!session) return NextResponse.json({ error: 'Session expiree' }, { status: 401 });

  const { username, password, role = 'USER' } = await request.json();
  const check = validatePasswordStrength(password ?? '');
  if (!check.valid) return NextResponse.json({ error: check.message }, { status: 400 });

  if (await UserModel.findOne({ username: username?.toLowerCase() })) {
    return NextResponse.json({ error: 'Deja pris' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await UserModel.create({ username: username.toLowerCase(), passwordHash, role });
  await AuditLogModel.create({ action: 'USER_CREATED', userId: session.userId, username, metadata: { createdRole: role } });

  return NextResponse.json({ id: String(user._id), username: user.username, role: user.role }, { status: 201 });
}
