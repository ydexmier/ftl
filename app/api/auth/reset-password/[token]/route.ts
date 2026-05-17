import { NextRequest } from 'next/server';
import { PasswordResetRepository } from '@/src/repositories/db/PasswordResetRepository';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { AuditLogRepository } from '@/src/repositories/db/AuditLogRepository';
import { hashPassword, validatePasswordStrength } from '@/src/lib/auth/password';
import { ApiResponse } from '@/src/lib/api/responses';
import { validateResetPasswordBody } from '@/src/lib/validation';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const reset = await PasswordResetRepository.findByToken(token);
  if (!reset || reset.usedAt) return ApiResponse.badRequest('Lien invalide ou déjà utilisé');
  if (reset.expiresAt < new Date()) return ApiResponse.badRequest('Ce lien a expiré');

  return ApiResponse.ok({ valid: true });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const v = validateResetPasswordBody(await request.json());
  if (!v.ok) return ApiResponse.badRequest(v.error);

  const check = validatePasswordStrength(v.data.password);
  if (!check.valid) return ApiResponse.badRequest(check.message!);
  const { password } = v.data;

  const reset = await PasswordResetRepository.findByToken(token);
  if (!reset || reset.usedAt) return ApiResponse.badRequest('Lien invalide ou déjà utilisé');
  if (reset.expiresAt < new Date()) return ApiResponse.badRequest('Ce lien a expiré');

  const passwordHash = await hashPassword(password);
  await UserRepository.updatePassword(String(reset.userId), passwordHash);
  await PasswordResetRepository.markUsed(token);

  const user = await UserRepository.findById(String(reset.userId));
  await AuditLogRepository.create({
    action: 'PASSWORD_CHANGED',
    userId: reset.userId,
    username: user?.username ?? '',
    metadata: { via: 'forgot-password' },
  });

  return ApiResponse.ok({ reset: true });
}
