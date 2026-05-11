import { NextRequest } from 'next/server';
import InvitationModel from '@models/Invitation';
import AuditLogModel from '@models/AuditLog';
import { getAdminSession } from '@/src/lib/auth/getAdminSession';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { sendInvitationEmail } from '@/src/lib/email';
import { ApiResponse } from '@/src/lib/api/responses';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAdminSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const { id } = await params;
  const invitation = await InvitationModel.findById(id);
  if (!invitation) return ApiResponse.notFound('Invitation introuvable');
  if (invitation.status !== 'PENDING') {
    return ApiResponse.badRequest('Seules les invitations en attente peuvent être annulées');
  }

  invitation.status = 'CANCELLED';
  await invitation.save();

  const adminUser = await UserRepository.findById(String(auth.session.userId));
  await AuditLogModel.create({
    action: 'ADMIN_ACTION',
    userId: auth.session.userId,
    username: adminUser?.username ?? '',
    metadata: { action: 'INVITATION_CANCELLED', invitationId: id, email: invitation.email },
  });

  return ApiResponse.ok({ cancelled: true });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAdminSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const { id } = await params;
  const invitation = await InvitationModel.findById(id);
  if (!invitation) return ApiResponse.notFound('Invitation introuvable');
  if (invitation.status !== 'PENDING') {
    return ApiResponse.badRequest('Seules les invitations en attente peuvent être renvoyées');
  }

  if (await UserRepository.existsByEmail(invitation.email)) {
    return ApiResponse.conflict('Un compte existe déjà avec cet email');
  }

  const newToken = crypto.randomUUID();
  invitation.token = newToken;
  invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await invitation.save();

  try {
    await sendInvitationEmail(invitation.email, newToken);
  } catch (err) {
    return ApiResponse.serverError(err);
  }

  const adminUser = await UserRepository.findById(String(auth.session.userId));
  await AuditLogModel.create({
    action: 'ADMIN_ACTION',
    userId: auth.session.userId,
    username: adminUser?.username ?? '',
    metadata: { action: 'INVITATION_RESENT', invitationId: id, email: invitation.email },
  });

  return ApiResponse.ok({ resent: true });
}
