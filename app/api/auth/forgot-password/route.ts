import { NextRequest } from 'next/server';
import connectToMongoDB from '@/src/lib/db';
import UserModel from '@models/User';
import PasswordResetModel from '@models/PasswordReset';
import { sendPasswordResetEmail } from '@/src/lib/email';
import { ApiResponse } from '@/src/lib/api/responses';

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return ApiResponse.badRequest('Email invalide');
  }

  await connectToMongoDB();

  const user = await UserModel.findOne({ email: email.toLowerCase().trim() });

  // Réponse identique que l'email existe ou non (sécurité : pas d'énumération)
  if (!user) {
    return ApiResponse.ok({ sent: true });
  }

  // Invalider les anciens tokens en attente pour cet utilisateur
  await PasswordResetModel.deleteMany({ userId: user._id });

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

  await PasswordResetModel.create({ userId: user._id, token, expiresAt });

  try {
    await sendPasswordResetEmail(user.email, token);
  } catch {
    await PasswordResetModel.deleteOne({ token });
    return ApiResponse.serverError('Erreur lors de l\'envoi de l\'email');
  }

  return ApiResponse.ok({ sent: true });
}
