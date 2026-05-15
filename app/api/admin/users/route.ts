import { NextRequest } from 'next/server';
import { AuditLogRepository } from '@/src/repositories/db/AuditLogRepository';
import { hashPassword, validatePasswordStrength } from '@/src/lib/auth/password';
import { getAdminSession } from '@/src/lib/auth/getAdminSession';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { ApiResponse } from '@/src/lib/api/responses';
import { isValidEmail } from '@/src/lib/validation';

export async function GET(request: NextRequest) {
  const auth = await getAdminSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 25));
  const search = searchParams.get('search')?.trim() || '';
  const role = searchParams.get('role') || '';

  const { users, total } = await UserRepository.findWithFilters(search, role, page, limit);

  return ApiResponse.ok({
    users: users.map((u) => ({ ...u, _id: String(u._id) })),
    total,
    pages: Math.ceil(total / limit),
    page,
  });
}

export async function POST(request: NextRequest) {
  const auth = await getAdminSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const { username, email, password, role = 'USER' } = await request.json();

  const check = validatePasswordStrength(password ?? '');
  if (!check.valid) return ApiResponse.badRequest(check.message!);

  if (!email || !isValidEmail(email)) {
    return ApiResponse.badRequest('Email invalide');
  }

  if (await UserRepository.existsByUsername(username?.toLowerCase())) {
    return ApiResponse.conflict('Ce nom d\'utilisateur est déjà pris');
  }
  if (await UserRepository.existsByEmail(email?.toLowerCase())) {
    return ApiResponse.conflict('Cet email est déjà utilisé');
  }

  const passwordHash = await hashPassword(password);
  const user = await UserRepository.create({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    passwordHash,
    role,
  });

  const adminUser = await UserRepository.findById(String(auth.session.userId));
  await AuditLogRepository.create({
    action: 'USER_CREATED',
    userId: auth.session.userId,
    username: adminUser?.username ?? '',
    metadata: { createdUsername: username, createdRole: role },
  });

  return ApiResponse.created({ id: String(user._id), username: user.username, email: user.email, role: user.role });
}
