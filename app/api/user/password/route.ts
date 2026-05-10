import { NextRequest } from 'next/server';
import connectToMongoDB from '@/src/lib/db';
import UserModel from '@models/User';
import AuditLogModel from '@models/AuditLog';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/src/lib/auth/password';
import { ApiResponse } from '@/src/lib/api/responses';

export async function PATCH(request: NextRequest) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword) {
    return ApiResponse.badRequest('Les deux champs sont requis');
  }

  const check = validatePasswordStrength(newPassword);
  if (!check.valid) return ApiResponse.badRequest(check.message!);

  await connectToMongoDB();

  const user = await UserModel.findById(auth.userId);
  if (!user) return ApiResponse.notFound('Utilisateur introuvable');

  const valid = await verifyPassword(user.passwordHash, currentPassword);
  if (!valid) return ApiResponse.badRequest('Mot de passe actuel incorrect');

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  await AuditLogModel.create({
    action: 'PASSWORD_CHANGED',
    userId: auth.userId,
    username: user.username,
    metadata: { via: 'profile' },
  });

  return ApiResponse.ok({ changed: true });
}
