import { NextRequest } from 'next/server';
import { validatePasswordStrength } from '@/src/lib/auth/password';
import { InvitationRepository } from '@/src/repositories/db/InvitationRepository';
import { InvitationService } from '@/src/services/InvitationService';
import { ApiResponse } from '@/src/lib/api/responses';

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
  const { token } = await params;
  const { username, password } = await request.json();

  if (!username?.trim()) return ApiResponse.badRequest('Le pseudo est requis');

  const check = validatePasswordStrength(password ?? '');
  if (!check.valid) return ApiResponse.badRequest(check.message!);

  try {
    const result = await InvitationService.register(token, username, password);
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
