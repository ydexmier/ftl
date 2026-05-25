import { NextRequest } from 'next/server';
import { AuditLogRepository } from '@/src/repositories/db/AuditLogRepository';
import { hashPassword, validatePasswordStrength } from '@/src/lib/auth/password';
import { requireAdminSession } from '@/src/lib/auth/getAuthSession';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { ApiResponse } from '@/src/lib/api/responses';
import { validateAdminUserCreate } from '@/src/lib/validation';

export async function GET(request: NextRequest) {
  const result = await requireAdminSession(request);
  if ('error' in result) return result.error;

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
  const result = await requireAdminSession(request);
  if ('error' in result) return result.error;
  const { session } = result;

  const v = validateAdminUserCreate(await request.json());
  if (!v.ok) return ApiResponse.badRequest(v.error);
  const { username, email, password, role } = v.data;

  const check = validatePasswordStrength(password);
  if (!check.valid) return ApiResponse.badRequest(check.message!);

  if (await UserRepository.existsByUsername(username)) {
    return ApiResponse.conflict('Ce nom d\'utilisateur est déjà pris');
  }
  if (await UserRepository.existsByEmail(email)) {
    return ApiResponse.conflict('Cet email est déjà utilisé');
  }

  const passwordHash = await hashPassword(password);
  const user = await UserRepository.create({ username, email, passwordHash, role });

  const adminUser = await UserRepository.findById(session.userId);
  await AuditLogRepository.create({
    action: 'USER_CREATED',
    userId: session.userId,
    username: adminUser?.username ?? '',
    metadata: { createdUsername: username, createdRole: role },
  });

  return ApiResponse.created({ id: String(user._id), username: user.username, email: user.email, role: user.role });
}
