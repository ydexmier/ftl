import { NextRequest } from 'next/server';
import { ApiResponse } from '@/src/lib/api/responses';
import { AccessRequestRepository } from '@/src/repositories/db/AccessRequestRepository';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { verifyHcaptcha } from '@/src/lib/hcaptcha';
import { isValidEmail } from '@/src/lib/validation';

export async function POST(req: NextRequest) {
  const { email, reason, captchaToken } = await req.json();

  if (!email || !isValidEmail(email)) {
    return ApiResponse.badRequest('Adresse email invalide');
  }

  if (!captchaToken) {
    return ApiResponse.badRequest('Vérification anti-robot requise');
  }

  const captchaValid = await verifyHcaptcha(captchaToken);
  if (!captchaValid) {
    return ApiResponse.badRequest('Vérification anti-robot échouée');
  }

  const normalized = email.trim().toLowerCase();

  if (await UserRepository.existsByEmail(normalized)) {
    return ApiResponse.badRequest('Un compte existe déjà avec cet email');
  }

  if (await AccessRequestRepository.findPendingByEmail(normalized)) {
    return ApiResponse.badRequest('Une demande est déjà en attente pour cet email');
  }

  await AccessRequestRepository.create(normalized, reason?.trim() || undefined);

  return ApiResponse.created({ message: 'Demande envoyée avec succès' });
}
