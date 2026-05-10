import { NextRequest } from 'next/server';
import connectToMongoDB from '@/src/lib/db';
import InvitationModel from '@models/Invitation';
import UserModel from '@models/User';
import GroupModel from '@models/Group';
import AuditLogModel from '@models/AuditLog';
import { hashPassword, validatePasswordStrength } from '@/src/lib/auth/password';
import { sendWelcomeEmail } from '@/src/lib/email';
import { ApiResponse } from '@/src/lib/api/responses';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  await connectToMongoDB();

  const invitation = await InvitationModel.findOne({ token })
    .populate('groupIds', 'name')
    .lean();

  if (!invitation) return ApiResponse.notFound('Invitation introuvable ou invalide');
  if (invitation.status !== 'PENDING') {
    return ApiResponse.badRequest('Cette invitation a déjà été utilisée ou annulée');
  }
  if (invitation.expiresAt < new Date()) {
    await InvitationModel.updateOne({ _id: invitation._id }, { status: 'EXPIRED' });
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
  await connectToMongoDB();

  const invitation = await InvitationModel.findOne({ token });
  if (!invitation) return ApiResponse.notFound('Invitation introuvable ou invalide');
  if (invitation.status !== 'PENDING') {
    return ApiResponse.badRequest('Cette invitation a déjà été utilisée ou annulée');
  }
  if (invitation.expiresAt < new Date()) {
    invitation.status = 'EXPIRED';
    await invitation.save();
    return ApiResponse.badRequest('Cette invitation a expiré');
  }

  const { username, password } = await request.json();

  if (!username?.trim()) return ApiResponse.badRequest('Le pseudo est requis');

  const check = validatePasswordStrength(password ?? '');
  if (!check.valid) return ApiResponse.badRequest(check.message!);

  if (await UserModel.findOne({ username: username.toLowerCase() })) {
    return ApiResponse.conflict('Ce pseudo est déjà utilisé');
  }
  if (await UserModel.findOne({ email: invitation.email })) {
    return ApiResponse.conflict('Un compte existe déjà avec cet email');
  }

  const passwordHash = await hashPassword(password);
  const user = await UserModel.create({
    username: username.toLowerCase().trim(),
    email: invitation.email,
    passwordHash,
    role: 'USER',
  });

  if (invitation.groupIds.length > 0) {
    await GroupModel.updateMany(
      { _id: { $in: invitation.groupIds } },
      {
        $push: {
          members: {
            userId: user._id,
            role: 'MEMBER',
            joinedAt: new Date(),
            invitedBy: invitation.invitedBy,
          },
        },
      },
    );
  }

  invitation.status = 'USED';
  invitation.usedAt = new Date();
  await invitation.save();

  await AuditLogModel.create({
    action: 'USER_CREATED',
    userId: user._id,
    username: user.username,
    metadata: { via: 'invitation', invitedBy: String(invitation.invitedBy) },
  });

  await sendWelcomeEmail(invitation.email, user.username);

  return ApiResponse.created({ username: user.username });
}
