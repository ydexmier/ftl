import { NextRequest } from 'next/server';
import { getAdminSession } from '@/src/lib/auth/getAdminSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { AccessRequestRepository } from '@/src/repositories/db/AccessRequestRepository';
import { InvitationRepository } from '@/src/repositories/db/InvitationRepository';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { AuditLogRepository } from '@/src/repositories/db/AuditLogRepository';
import { sendInvitationEmail } from '@/src/lib/email';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAdminSession(req);
  if (!auth) return ApiResponse.unauthorized();

  const { id } = await params;
  const { action } = await req.json();

  if (action !== 'approve' && action !== 'reject') {
    return ApiResponse.badRequest('Action invalide');
  }

  const request = await AccessRequestRepository.findById(id);
  if (!request) return ApiResponse.notFound('Demande introuvable');
  if (request.status !== 'PENDING') {
    return ApiResponse.badRequest('Cette demande a déjà été traitée');
  }

  if (action === 'reject') {
    await AccessRequestRepository.reject(id, String(auth.session.userId));
    return ApiResponse.ok({ status: 'REJECTED' });
  }

  // approve: trigger invitation flow
  const email = request.email;

  if (await UserRepository.existsByEmail(email)) {
    return ApiResponse.badRequest('Un compte existe déjà avec cet email');
  }

  if (await InvitationRepository.findPendingByEmail(email)) {
    return ApiResponse.badRequest('Une invitation est déjà en attente pour cet email');
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  try {
    await sendInvitationEmail(email, token);
  } catch {
    return ApiResponse.serverError('Erreur lors de l\'envoi de l\'email');
  }

  await InvitationRepository.create({
    email,
    token,
    groupIds: [],
    invitedBy: String(auth.session.userId),
    expiresAt,
  });

  await AccessRequestRepository.approve(id, String(auth.session.userId));

  const adminUser = await UserRepository.findById(String(auth.session.userId));
  await AuditLogRepository.create({
    action: 'ADMIN_ACTION',
    userId: auth.session.userId,
    username: adminUser?.username ?? '',
    metadata: { action: 'ACCESS_REQUEST_APPROVED', email },
  });

  return ApiResponse.ok({ status: 'APPROVED' });
}
