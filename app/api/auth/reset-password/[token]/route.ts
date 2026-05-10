import { NextRequest } from 'next/server';
import connectToMongoDB from '@/src/lib/db';
import PasswordResetModel from '@models/PasswordReset';
import UserModel from '@models/User';
import AuditLogModel from '@models/AuditLog';
import { hashPassword, validatePasswordStrength } from '@/src/lib/auth/password';
import { ApiResponse } from '@/src/lib/api/responses';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  await connectToMongoDB();

  const reset = await PasswordResetModel.findOne({ token });
  if (!reset || reset.usedAt) return ApiResponse.badRequest('Lien invalide ou déjà utilisé');
  if (reset.expiresAt < new Date()) return ApiResponse.badRequest('Ce lien a expiré');

  return ApiResponse.ok({ valid: true });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const { password } = await request.json();

  const check = validatePasswordStrength(password ?? '');
  if (!check.valid) return ApiResponse.badRequest(check.message!);

  await connectToMongoDB();

  const reset = await PasswordResetModel.findOne({ token });
  if (!reset || reset.usedAt) return ApiResponse.badRequest('Lien invalide ou déjà utilisé');
  if (reset.expiresAt < new Date()) return ApiResponse.badRequest('Ce lien a expiré');

  const passwordHash = await hashPassword(password);
  await UserModel.findByIdAndUpdate(reset.userId, { passwordHash });

  reset.usedAt = new Date();
  await reset.save();

  const user = await UserModel.findById(reset.userId).select('username').lean();
  await AuditLogModel.create({
    action: 'PASSWORD_CHANGED',
    userId: reset.userId,
    username: user?.username ?? '',
    metadata: { via: 'forgot-password' },
  });

  return ApiResponse.ok({ reset: true });
}
