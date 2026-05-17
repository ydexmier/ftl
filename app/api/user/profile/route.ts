import { NextRequest } from 'next/server';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { AuditLogRepository } from '@/src/repositories/db/AuditLogRepository';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { isValidEmail } from '@/src/lib/validation';

export async function PATCH(request: NextRequest) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const { username, email } = await request.json();

  if (!username?.trim() && !email?.trim()) {
    return ApiResponse.badRequest('Au moins un champ est requis');
  }

  if (email && !isValidEmail(email)) {
    return ApiResponse.badRequest('Email invalide');
  }

  if (username) {
    const exists = await UserRepository.existsByUsername(username.toLowerCase().trim(), auth.userId);
    if (exists) return ApiResponse.conflict('Ce pseudo est déjà utilisé');
  }

  if (email) {
    const exists = await UserRepository.existsByEmail(email.toLowerCase().trim(), auth.userId);
    if (exists) return ApiResponse.conflict('Cet email est déjà utilisé');
  }

  const update: Record<string, string> = {};
  if (username) update.username = username.toLowerCase().trim();
  if (email) update.email = email.toLowerCase().trim();

  const user = await UserRepository.update(auth.userId, update);

  await AuditLogRepository.create({
    action: 'USER_UPDATED',
    userId: auth.userId,
    username: user?.username ?? '',
    metadata: { updatedFields: Object.keys(update) },
  });

  return ApiResponse.ok({ username: user?.username, email: user?.email });
}
