import { describe, it, expect, vi } from 'vitest';
import { POST as sendInvitations, GET as listInvitations } from '../../app/api/admin/invitations/route';
import { DELETE as cancelInvitation, POST as resendInvitation } from '../../app/api/admin/invitations/[id]/route';
import InvitationModel from '@models/Invitation';
import { createTestUser, createAdminUser, createAuthCookie, makeRequest } from '../test/helpers';
import { sendInvitationEmail } from '@/src/lib/email';

describe('POST /api/admin/invitations', () => {
  it('retourne 401 sans session', async () => {
    const req = makeRequest('POST', '/api/admin/invitations', { emails: ['new@example.com'] });
    const res = await sendInvitations(req);
    expect(res.status).toBe(401);
  });

  it('retourne 401 si rôle USER', async () => {
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('POST', '/api/admin/invitations', { emails: ['new@example.com'] }, cookie);
    const res = await sendInvitations(req);
    expect(res.status).toBe(401);
  });

  it('skip si le mail a déjà un compte', async () => {
    const admin = await createAdminUser();
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    await createTestUser({ email: 'existing@example.com' });

    const req = makeRequest('POST', '/api/admin/invitations', { emails: ['existing@example.com'] }, cookie);
    const res = await sendInvitations(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.sent).toBe(0);
    expect(data.skipped[0].reason).toMatch(/compte existe/i);
  });

  it('skip si une invitation est déjà en attente', async () => {
    const admin = await createAdminUser();
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    await InvitationModel.create({
      email: 'pending@example.com',
      token: crypto.randomUUID(),
      invitedBy: admin._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const req = makeRequest('POST', '/api/admin/invitations', { emails: ['pending@example.com'] }, cookie);
    const res = await sendInvitations(req);
    const data = await res.json();

    expect(data.sent).toBe(0);
    expect(data.skipped[0].reason).toMatch(/invitation.*en attente/i);
  });

  it('envoie l\'invitation et crée l\'entrée en BDD', async () => {
    const admin = await createAdminUser();
    const cookie = await createAuthCookie(admin._id, 'ADMIN');

    const req = makeRequest('POST', '/api/admin/invitations', { emails: ['newuser@example.com'] }, cookie);
    const res = await sendInvitations(req);
    const data = await res.json();

    expect(data.sent).toBe(1);
    expect(sendInvitationEmail).toHaveBeenCalledWith('newuser@example.com', expect.any(String));

    const inv = await InvitationModel.findOne({ email: 'newuser@example.com' });
    expect(inv).not.toBeNull();
    expect(inv!.status).toBe('PENDING');
  });

  it('envoie plusieurs invitations en une seule requête', async () => {
    const admin = await createAdminUser();
    const cookie = await createAuthCookie(admin._id, 'ADMIN');

    const emails = ['a@example.com', 'b@example.com', 'c@example.com'];
    const req = makeRequest('POST', '/api/admin/invitations', { emails }, cookie);
    const res = await sendInvitations(req);
    const data = await res.json();

    expect(data.sent).toBe(3);
    const count = await InvitationModel.countDocuments({ status: 'PENDING' });
    expect(count).toBe(3);
  });
});

describe('DELETE /api/admin/invitations/[id]', () => {
  it('annule une invitation en attente', async () => {
    const admin = await createAdminUser();
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const inv = await InvitationModel.create({
      email: 'cancel@example.com',
      token: crypto.randomUUID(),
      invitedBy: admin._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const req = makeRequest('DELETE', `/api/admin/invitations/${inv._id}`, undefined, cookie);
    const res = await cancelInvitation(req, { params: Promise.resolve({ id: String(inv._id) }) });

    expect(res.status).toBe(200);
    const updated = await InvitationModel.findById(inv._id);
    expect(updated!.status).toBe('CANCELLED');
  });

  it('refuse d\'annuler une invitation déjà utilisée', async () => {
    const admin = await createAdminUser();
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const inv = await InvitationModel.create({
      email: 'used@example.com',
      token: crypto.randomUUID(),
      invitedBy: admin._id,
      status: 'USED',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const req = makeRequest('DELETE', `/api/admin/invitations/${inv._id}`, undefined, cookie);
    const res = await cancelInvitation(req, { params: Promise.resolve({ id: String(inv._id) }) });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/admin/invitations/[id] (renvoyer)', () => {
  it('renouvelle le token et renvoie l\'email', async () => {
    const admin = await createAdminUser();
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const oldToken = crypto.randomUUID();
    const inv = await InvitationModel.create({
      email: 'resend@example.com',
      token: oldToken,
      invitedBy: admin._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const req = makeRequest('POST', `/api/admin/invitations/${inv._id}`, undefined, cookie);
    const res = await resendInvitation(req, { params: Promise.resolve({ id: String(inv._id) }) });

    expect(res.status).toBe(200);
    const updated = await InvitationModel.findById(inv._id);
    expect(updated!.token).not.toBe(oldToken);
    expect(sendInvitationEmail).toHaveBeenCalledWith('resend@example.com', updated!.token);
  });
});
