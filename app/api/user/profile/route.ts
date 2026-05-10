import { NextRequest } from 'next/server';
import connectToMongoDB from '@/src/lib/db';
import UserModel from '@models/User';
import AuditLogModel from '@models/AuditLog';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';

export async function PATCH(request: NextRequest) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const { username, email } = await request.json();

  if (!username?.trim() && !email?.trim()) {
    return ApiResponse.badRequest('Au moins un champ est requis');
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return ApiResponse.badRequest('Email invalide');
  }

  await connectToMongoDB();

  if (username) {
    const existing = await UserModel.findOne({
      username: username.toLowerCase().trim(),
      _id: { $ne: auth.userId },
    });
    if (existing) return ApiResponse.conflict('Ce pseudo est déjà utilisé');
  }

  if (email) {
    const existing = await UserModel.findOne({
      email: email.toLowerCase().trim(),
      _id: { $ne: auth.userId },
    });
    if (existing) return ApiResponse.conflict('Cet email est déjà utilisé');
  }

  const update: Record<string, string> = {};
  if (username) update.username = username.toLowerCase().trim();
  if (email) update.email = email.toLowerCase().trim();

  const user = await UserModel.findByIdAndUpdate(auth.userId, update, { new: true })
    .select('-passwordHash')
    .lean();

  await AuditLogModel.create({
    action: 'USER_UPDATED',
    userId: auth.userId,
    username: user?.username ?? '',
    metadata: { updatedFields: Object.keys(update) },
  });

  return ApiResponse.ok({ username: user?.username, email: user?.email });
}
