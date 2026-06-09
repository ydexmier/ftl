import { NextRequest } from 'next/server';
import { ApiResponse } from '@/src/lib/api/responses';
import { AccessRequestRepository } from '@/src/repositories/db/AccessRequestRepository';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { verifyHcaptcha } from '@/src/lib/hcaptcha';
import { validateAccessRequestBody } from '@/src/lib/validation';
import { checkRateLimit } from '@/src/lib/auth/rateLimit';
import { getIp } from '@/src/lib/auth/getIp';

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const rl = checkRateLimit(`access-request:${ip}`);
  if (!rl.allowed) return ApiResponse.tooManyRequests('Trop de tentatives. Réessayez dans quelques minutes.');

  const v = validateAccessRequestBody(await req.json());
  if (!v.ok) return ApiResponse.badRequest(v.error);
  const { email, reason, captchaToken } = v.data;

  const captchaValid = await verifyHcaptcha(captchaToken);
  if (!captchaValid) return ApiResponse.badRequest('Vérification anti-robot échouée');

  if (await UserRepository.existsByEmail(email)) {
    return ApiResponse.badRequest('Un compte existe déjà avec cet email');
  }

  if (await AccessRequestRepository.findPendingByEmail(email)) {
    return ApiResponse.badRequest('Une demande est déjà en attente pour cet email');
  }

  await AccessRequestRepository.create(email, reason);

  return ApiResponse.created({ message: 'Demande envoyée avec succès' });
}
