import { NextRequest } from 'next/server';
import { AuditLogRepository } from '@/src/repositories/db/AuditLogRepository';
import { requireAdminSession } from '@/src/lib/auth/getAuthSession';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { InvitationRepository } from '@/src/repositories/db/InvitationRepository';
import { sendInvitationEmail } from '@/src/lib/email';
import { ApiResponse } from '@/src/lib/api/responses';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const result = await requireAdminSession(request);
  if ('error' in result) return result.error;
  const { session } = result;

  const { id } = await params;
  const invitation = await InvitationRepository.findById(id);
  if (!invitation) return ApiResponse.notFound('Invitation introuvable');
  if (invitation.status !== 'PENDING') {
    return ApiResponse.badRequest('Seules les invitations en attente peuvent être annulées');
  }

  await InvitationRepository.cancel(id);

  const adminUser = await UserRepository.findById(session.userId);
  await AuditLogRepository.create({
    action: 'ADMIN_ACTION',
    userId: session.userId,
    username: adminUser?.username ?? '',
    metadata: { action: 'INVITATION_CANCELLED', invitationId: id, email: invitation.email },
  });

  return ApiResponse.ok({ cancelled: true });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const result = await requireAdminSession(request);
  if ('error' in result) return result.error;
  const { session } = result;

  const { id } = await params;
  const invitation = await InvitationRepository.findById(id);
  if (!invitation) return ApiResponse.notFound('Invitation introuvable');
  if (invitation.status !== 'PENDING') {
    return ApiResponse.badRequest('Seules les invitations en attente peuvent être renvoyées');
  }

  if (await UserRepository.existsByEmail(invitation.email)) {
    return ApiResponse.conflict('Un compte existe déjà avec cet email');
  }

  const newToken = crypto.randomUUID();
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await InvitationRepository.renewToken(id, newToken, newExpiresAt);

  try {
    await sendInvitationEmail(invitation.email, newToken);
  } catch (err) {
    return ApiResponse.serverError(err);
  }

  const adminUser = await UserRepository.findById(session.userId);
  await AuditLogRepository.create({
    action: 'ADMIN_ACTION',
    userId: session.userId,
    username: adminUser?.username ?? '',
    metadata: { action: 'INVITATION_RESENT', invitationId: id, email: invitation.email },
  });

  return ApiResponse.ok({ resent: true });
}
