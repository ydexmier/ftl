import { NextRequest } from 'next/server';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { PasswordResetRepository } from '@/src/repositories/db/PasswordResetRepository';
import { sendPasswordResetEmail } from '@/src/lib/email';
import { ApiResponse } from '@/src/lib/api/responses';
import { isValidEmail } from '@/src/lib/validation';

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || !isValidEmail(email)) {
    return ApiResponse.badRequest('Email invalide');
  }

  const user = await UserRepository.findByEmail(email.toLowerCase().trim());

  // Réponse identique que l'email existe ou non (sécurité : pas d'énumération)
  if (!user) {
    return ApiResponse.ok({ sent: true });
  }

  await PasswordResetRepository.invalidateForUser(String(user._id));

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

  await PasswordResetRepository.create({ userId: String(user._id), token, expiresAt });

  try {
    await sendPasswordResetEmail(user.email, token);
  } catch {
    await PasswordResetRepository.deleteByToken(token);
    return ApiResponse.serverError('Erreur lors de l\'envoi de l\'email');
  }

  return ApiResponse.ok({ sent: true });
}
