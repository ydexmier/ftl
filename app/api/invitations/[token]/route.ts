import { NextRequest } from 'next/server';
import { validatePasswordStrength } from '@/src/lib/auth/password';
import { validateRegisterBody } from '@/src/lib/validation';
import { InvitationRepository } from '@/src/repositories/db/InvitationRepository';
import { InvitationService } from '@/src/services/InvitationService';
import { ApiResponse } from '@/src/lib/api/responses';
import { checkRateLimit } from '@/src/lib/auth/rateLimit';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const invitation = await InvitationRepository.findByTokenWithGroups(token);
  if (!invitation) return ApiResponse.notFound('Invitation introuvable ou invalide');
  if (invitation.status !== 'PENDING') {
    return ApiResponse.badRequest('Cette invitation a déjà été utilisée ou annulée');
  }
  if (invitation.expiresAt < new Date()) {
    await InvitationRepository.markExpired(String(invitation._id));
    return ApiResponse.badRequest('Cette invitation a expiré');
  }

  return ApiResponse.ok({
    email: invitation.email,
    groups: invitation.groupIds,
    expiresAt: invitation.expiresAt.toISOString(),
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = checkRateLimit(`register-invite:${ip}`);
  if (!rl.allowed) return ApiResponse.tooManyRequests('Trop de tentatives. Réessayez dans 15 minutes.');

  const { token } = await params;
  const v = validateRegisterBody(await request.json());
  if (!v.ok) return ApiResponse.badRequest(v.error);

  const check = validatePasswordStrength(v.data.password);
  if (!check.valid) return ApiResponse.badRequest(check.message!);

  try {
    const result = await InvitationService.register(token, v.data.username, v.data.password);
    return ApiResponse.created(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'INVITATION_NOT_FOUND') return ApiResponse.notFound('Invitation introuvable ou invalide');
    if (msg === 'INVITATION_ALREADY_USED') return ApiResponse.badRequest('Cette invitation a déjà été utilisée ou annulée');
    if (msg === 'INVITATION_EXPIRED') return ApiResponse.badRequest('Cette invitation a expiré');
    if (msg === 'USERNAME_TAKEN') return ApiResponse.conflict('Ce pseudo est déjà utilisé');
    if (msg === 'EMAIL_TAKEN') return ApiResponse.conflict('Un compte existe déjà avec cet email');
    return ApiResponse.serverError(err);
  }
}
