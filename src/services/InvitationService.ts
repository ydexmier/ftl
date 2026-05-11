import { InvitationRepository } from '@/src/repositories/db/InvitationRepository';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import AuditLogModel from '@models/AuditLog';
import { hashPassword } from '@/src/lib/auth/password';
import { sendWelcomeEmail } from '@/src/lib/email';

export const InvitationService = {
  async register(token: string, username: string, password: string) {
    const invitation = await InvitationRepository.findByToken(token);
    if (!invitation) throw new Error('INVITATION_NOT_FOUND');
    if (invitation.status !== 'PENDING') throw new Error('INVITATION_ALREADY_USED');
    if (invitation.expiresAt < new Date()) {
      await InvitationRepository.markExpired(String(invitation._id));
      throw new Error('INVITATION_EXPIRED');
    }

    if (await UserRepository.existsByUsername(username.toLowerCase())) {
      throw new Error('USERNAME_TAKEN');
    }
    if (await UserRepository.existsByEmail(invitation.email)) {
      throw new Error('EMAIL_TAKEN');
    }

    const passwordHash = await hashPassword(password);
    const user = await UserRepository.create({
      username: username.toLowerCase().trim(),
      email: invitation.email,
      passwordHash,
      role: 'USER',
    });

    if (invitation.groupIds.length > 0) {
      await GroupRepository.addMemberToGroups(
        invitation.groupIds.map(String),
        String(user._id),
        String(invitation.invitedBy),
      );
    }

    await InvitationRepository.markUsed(String(invitation._id));

    await AuditLogModel.create({
      action: 'USER_CREATED',
      userId: user._id,
      username: user.username,
      metadata: { via: 'invitation', invitedBy: String(invitation.invitedBy) },
    });

    await sendWelcomeEmail(invitation.email, user.username);

    return { username: user.username };
  },
};
