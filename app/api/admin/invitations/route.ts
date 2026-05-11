import { NextRequest } from 'next/server';
import InvitationModel from '@models/Invitation';
import AuditLogModel from '@models/AuditLog';
import { getAdminSession } from '@/src/lib/auth/getAdminSession';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { sendInvitationEmail } from '@/src/lib/email';
import { ApiResponse } from '@/src/lib/api/responses';

export async function GET(request: NextRequest) {
  const auth = await getAdminSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 25));
  const status = searchParams.get('status') || '';

  const query: Record<string, unknown> = {};
  if (status) query.status = status;

  const [invitations, total] = await Promise.all([
    InvitationModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('invitedBy', 'username')
      .populate('groupIds', 'name')
      .lean(),
    InvitationModel.countDocuments(query),
  ]);

  return ApiResponse.ok({
    invitations: invitations.map((inv) => ({
      _id: String(inv._id),
      email: inv.email,
      status: inv.status,
      expiresAt: inv.expiresAt.toISOString(),
      createdAt: inv.createdAt.toISOString(),
      usedAt: inv.usedAt?.toISOString() ?? null,
      invitedBy: inv.invitedBy,
      groups: inv.groupIds,
    })),
    total,
    pages: Math.ceil(total / limit),
    page,
  });
}

export async function POST(request: NextRequest) {
  const auth = await getAdminSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const { emails, groupIds = [] } = await request.json();

  if (!Array.isArray(emails) || emails.length === 0) {
    return ApiResponse.badRequest('Au moins un email est requis');
  }

  const normalized = emails.map((e: string) => e.trim().toLowerCase()).filter(Boolean);
  const unique = [...new Set(normalized)];

  const results: { email: string; status: 'sent' | 'skipped'; reason?: string }[] = [];

  for (const email of unique) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      results.push({ email, status: 'skipped', reason: 'Email invalide' });
      continue;
    }

    if (await UserRepository.existsByEmail(email)) {
      results.push({ email, status: 'skipped', reason: 'Un compte existe déjà avec cet email' });
      continue;
    }

    const existingInvitation = await InvitationModel.findOne({ email, status: 'PENDING' });
    if (existingInvitation) {
      results.push({ email, status: 'skipped', reason: 'Une invitation est déjà en attente pour cet email' });
      continue;
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    try {
      await sendInvitationEmail(email, token);
    } catch {
      results.push({ email, status: 'skipped', reason: "Erreur lors de l'envoi de l'email" });
      continue;
    }

    await InvitationModel.create({
      email,
      token,
      groupIds,
      invitedBy: auth.session.userId,
      expiresAt,
    });

    results.push({ email, status: 'sent' });
  }

  const adminUser = await UserRepository.findById(String(auth.session.userId));
  await AuditLogModel.create({
    action: 'ADMIN_ACTION',
    userId: auth.session.userId,
    username: adminUser?.username ?? '',
    metadata: { action: 'INVITATIONS_SENT', results },
  });

  const sent = results.filter((r) => r.status === 'sent').length;
  const skipped = results.filter((r) => r.status === 'skipped');

  return ApiResponse.ok({ sent, skipped, results });
}
