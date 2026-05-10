import { describe, it, expect } from 'vitest';
import { GET as validateToken, POST as register } from '../../app/api/invitations/[token]/route';
import InvitationModel from '@models/Invitation';
import UserModel from '@models/User';
import GroupModel from '@models/Group';
import { createTestUser, createAdminUser, makeRequest } from '../test/helpers';
import { sendWelcomeEmail } from '@/src/lib/email';

async function createInvitation(overrides: Partial<{
  email: string;
  status: string;
  expiresAt: Date;
  groupIds: string[];
}> = {}) {
  const admin = await UserModel.findOne({ role: 'ADMIN' }) ?? await createAdminUser();
  return InvitationModel.create({
    email: overrides.email ?? 'invite@example.com',
    token: crypto.randomUUID(),
    invitedBy: admin._id,
    status: overrides.status ?? 'PENDING',
    groupIds: overrides.groupIds ?? [],
    expiresAt: overrides.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
}

describe('GET /api/invitations/[token]', () => {
  it('retourne les infos de l\'invitation pour un token valide', async () => {
    const inv = await createInvitation();
    const req = makeRequest('GET', `/api/invitations/${inv.token}`);
    const res = await validateToken(req, { params: Promise.resolve({ token: inv.token }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.email).toBe('invite@example.com');
  });

  it('retourne une erreur pour un token inexistant', async () => {
    const req = makeRequest('GET', '/api/invitations/invalid-token');
    const res = await validateToken(req, { params: Promise.resolve({ token: 'invalid-token' }) });
    expect(res.status).toBe(404);
  });

  it('retourne une erreur pour un token expiré', async () => {
    const inv = await createInvitation({ expiresAt: new Date(Date.now() - 1000) });
    const req = makeRequest('GET', `/api/invitations/${inv.token}`);
    const res = await validateToken(req, { params: Promise.resolve({ token: inv.token }) });
    expect(res.status).toBe(400);
  });

  it('retourne une erreur pour un token déjà utilisé', async () => {
    const inv = await createInvitation({ status: 'USED' });
    const req = makeRequest('GET', `/api/invitations/${inv.token}`);
    const res = await validateToken(req, { params: Promise.resolve({ token: inv.token }) });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/invitations/[token]', () => {
  it('crée un compte et marque le token comme utilisé', async () => {
    const inv = await createInvitation();
    const req = makeRequest('POST', `/api/invitations/${inv.token}`, {
      username: 'newplayer',
      password: 'StrongPass1!',
    });
    const res = await register(req, { params: Promise.resolve({ token: inv.token }) });
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.username).toBe('newplayer');

    const user = await UserModel.findOne({ username: 'newplayer' });
    expect(user).not.toBeNull();
    expect(user!.email).toBe('invite@example.com');
    expect(user!.role).toBe('USER');

    const updated = await InvitationModel.findById(inv._id);
    expect(updated!.status).toBe('USED');
    expect(updated!.usedAt).not.toBeNull();
  });

  it('envoie l\'email de bienvenue après inscription', async () => {
    const inv = await createInvitation();
    const req = makeRequest('POST', `/api/invitations/${inv.token}`, {
      username: 'welcometest',
      password: 'StrongPass1!',
    });
    await register(req, { params: Promise.resolve({ token: inv.token }) });
    expect(sendWelcomeEmail).toHaveBeenCalledWith('invite@example.com', 'welcometest');
  });

  it('ajoute le user aux groupes spécifiés dans l\'invitation', async () => {
    const admin = await createAdminUser();
    const group = await GroupModel.create({
      name: 'Test Group',
      createdBy: admin._id,
      members: [],
    });
    const inv = await createInvitation({ groupIds: [String(group._id)] });

    const req = makeRequest('POST', `/api/invitations/${inv.token}`, {
      username: 'groupplayer',
      password: 'StrongPass1!',
    });
    await register(req, { params: Promise.resolve({ token: inv.token }) });

    const updatedGroup = await GroupModel.findById(group._id);
    const user = await UserModel.findOne({ username: 'groupplayer' });
    const isMember = updatedGroup!.members.some((m) => String(m.userId) === String(user!._id));
    expect(isMember).toBe(true);
  });

  it('refuse si le pseudo est déjà pris', async () => {
    await createTestUser({ username: 'taken' });
    const inv = await createInvitation({ email: 'other@example.com' });
    const req = makeRequest('POST', `/api/invitations/${inv.token}`, {
      username: 'taken',
      password: 'StrongPass1!',
    });
    const res = await register(req, { params: Promise.resolve({ token: inv.token }) });
    expect(res.status).toBe(409);
  });

  it('refuse un mot de passe trop faible', async () => {
    const inv = await createInvitation();
    const req = makeRequest('POST', `/api/invitations/${inv.token}`, {
      username: 'weakpwd',
      password: '123',
    });
    const res = await register(req, { params: Promise.resolve({ token: inv.token }) });
    expect(res.status).toBe(400);
  });

  it('ne peut pas utiliser le même token deux fois', async () => {
    const inv = await createInvitation();
    const body = { username: 'onceonly', password: 'StrongPass1!' };

    await register(makeRequest('POST', `/api/invitations/${inv.token}`, body), {
      params: Promise.resolve({ token: inv.token }),
    });
    const res = await register(makeRequest('POST', `/api/invitations/${inv.token}`, {
      username: 'secondattempt',
      password: 'StrongPass1!',
    }), { params: Promise.resolve({ token: inv.token }) });

    expect(res.status).toBe(400);
  });
});
