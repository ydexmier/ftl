import { NextRequest } from 'next/server';
import { hashPassword, validatePasswordStrength } from '@/src/lib/auth/password';
import { getAdminSession } from '@/src/lib/auth/getAdminSession';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { AuditLogRepository } from '@/src/repositories/db/AuditLogRepository';
import { SessionRepository } from '@/src/repositories/db/SessionRepository';
import { ApiResponse } from '@/src/lib/api/responses';
import { validateAdminUserUpdate } from '@/src/lib/validation';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await getAdminSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const { id } = await params;
  const user = await UserRepository.findById(id);
  if (!user) return ApiResponse.notFound('Utilisateur introuvable');

  const [activeSessions, recentLogs] = await Promise.all([
    SessionRepository.countActive(id),
    AuditLogRepository.findByUserId(id, 10),
  ]);

  return ApiResponse.ok({
    user: { ...user, _id: String(user._id) },
    activeSessions,
    recentLogs: recentLogs.map((l) => ({ ...l, _id: String(l._id), userId: String(l.userId) })),
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await getAdminSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const { id } = await params;
  const user = await UserRepository.findById(id);
  if (!user) return ApiResponse.notFound('Utilisateur introuvable');

  const v = validateAdminUserUpdate(await request.json());
  if (!v.ok) return ApiResponse.badRequest(v.error);
  const { username, email, role, password } = v.data;

  const updates: Record<string, unknown> = {};

  if (username !== undefined) {
    if (await UserRepository.existsByUsername(username, id)) {
      return ApiResponse.conflict('Ce nom d\'utilisateur est déjà pris');
    }
    updates.username = username;
  }

  if (email !== undefined) {
    if (await UserRepository.existsByEmail(email, id)) {
      return ApiResponse.conflict('Cet email est déjà utilisé');
    }
    updates.email = email;
  }

  if (role !== undefined) updates.role = role;

  const adminUser = await UserRepository.findById(String(auth.session.userId));
  const adminUsername = adminUser?.username ?? '';

  if (password) {
    const check = validatePasswordStrength(password);
    if (!check.valid) return ApiResponse.badRequest(check.message!);
    updates.passwordHash = await hashPassword(password);
    await AuditLogRepository.create({
      action: 'PASSWORD_CHANGED',
      userId: auth.session.userId,
      username: adminUsername,
      metadata: { targetUserId: id, targetUsername: user.username },
    });
  }

  const updatedUser = await UserRepository.update(id, updates);

  await AuditLogRepository.create({
    action: 'USER_UPDATED',
    userId: auth.session.userId,
    username: adminUsername,
    metadata: {
      targetUserId: id,
      targetUsername: user.username,
      fields: Object.keys(updates).filter((k) => k !== 'passwordHash'),
    },
  });

  return ApiResponse.ok({
    user: {
      _id: String(updatedUser!._id),
      username: updatedUser!.username,
      email: updatedUser!.email,
      role: updatedUser!.role,
    },
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await getAdminSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const { id } = await params;

  if (String(auth.session.userId) === id) {
    return ApiResponse.badRequest('Vous ne pouvez pas supprimer votre propre compte');
  }

  const user = await UserRepository.findById(id);
  if (!user) return ApiResponse.notFound('Utilisateur introuvable');

  const adminUser = await UserRepository.findById(String(auth.session.userId));

  await Promise.all([
    UserRepository.delete(id),
    SessionRepository.deleteByUserId(id),
  ]);

  await AuditLogRepository.create({
    action: 'USER_DELETED',
    userId: auth.session.userId,
    username: adminUser?.username ?? '',
    metadata: { deletedUserId: id, deletedUsername: user.username },
  });

  return ApiResponse.noContent();
}
