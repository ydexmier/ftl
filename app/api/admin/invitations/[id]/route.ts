import { NextRequest } from 'next/server';
import connectToMongoDB from '@/src/lib/db';
import InvitationModel from '@models/Invitation';
import UserModel from '@models/User';
import AuditLogModel from '@models/AuditLog';
import { getSession } from '@/src/lib/auth/session';
import { verifyCookie } from '@/src/lib/auth/cookieSign';
import { hasRole } from '@/src/lib/auth/rbac';
import { sendInvitationEmail } from '@/src/lib/email';
import { ApiResponse } from '@/src/lib/api/responses';
import type { UserRole } from '@models/User';

async function getAdminSession(request: NextRequest) {
  const val = request.cookies.get('session')?.value;
  if (!val) return null;
  const parsed = await verifyCookie(val);
  if (!parsed || !hasRole(parsed.role as UserRole, 'ADMIN')) return null;
  await connectToMongoDB();
  const session = await getSession(parsed.sessionId);
  if (!session) return null;
  return { parsed, session };
}

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

  const adminUser = await UserModel.findById(auth.session.userId).select('username').lean();
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

  const existingUser = await UserModel.findOne({ email: invitation.email });
  if (existingUser) {
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

  const adminUser = await UserModel.findById(auth.session.userId).select('username').lean();
  await AuditLogModel.create({
    action: 'ADMIN_ACTION',
    userId: auth.session.userId,
    username: adminUser?.username ?? '',
    metadata: { action: 'INVITATION_RESENT', invitationId: id, email: invitation.email },
  });

  return ApiResponse.ok({ resent: true });
}
