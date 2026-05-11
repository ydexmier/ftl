import { describe, it, expect } from 'vitest';
import { PATCH as updateProfile } from '../../app/api/user/profile/route';
import { PATCH as updatePassword } from '../../app/api/user/password/route';
import UserModel from '@models/User';
import { createTestUser, createAuthCookie, makeRequest, DEFAULT_PASSWORD } from '../test/helpers';
import { verifyPassword } from '@/src/lib/auth/password';

describe('PATCH /api/user/profile', () => {
  it('retourne 401 sans session', async () => {
    const req = makeRequest('PATCH', '/api/user/profile', { username: 'new' });
    const res = await updateProfile(req);
    expect(res.status).toBe(401);
  });

  it('met à jour le pseudo', async () => {
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('PATCH', '/api/user/profile', { username: 'newpseudo', email: user.email }, cookie);
    const res = await updateProfile(req);

    expect(res.status).toBe(200);
    const updated = await UserModel.findById(user._id);
    expect(updated!.username).toBe('newpseudo');
  });

  it('met à jour l\'email', async () => {
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('PATCH', '/api/user/profile', { username: user.username, email: 'newemail@example.com' }, cookie);
    const res = await updateProfile(req);

    expect(res.status).toBe(200);
    const updated = await UserModel.findById(user._id);
    expect(updated!.email).toBe('newemail@example.com');
  });

  it('refuse si le pseudo est déjà utilisé par un autre compte', async () => {
    await createTestUser({ username: 'taken', email: 'taken@example.com' });
    const user = await createTestUser({ username: 'myuser', email: 'myuser@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');

    const req = makeRequest('PATCH', '/api/user/profile', { username: 'taken', email: user.email }, cookie);
    const res = await updateProfile(req);
    expect(res.status).toBe(409);
  });

  it('refuse si l\'email est déjà utilisé par un autre compte', async () => {
    await createTestUser({ username: 'other', email: 'taken@example.com' });
    const user = await createTestUser({ username: 'myuser', email: 'myuser@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');

    const req = makeRequest('PATCH', '/api/user/profile', { username: user.username, email: 'taken@example.com' }, cookie);
    const res = await updateProfile(req);
    expect(res.status).toBe(409);
  });

  it('accepte de garder son propre pseudo et email sans conflit', async () => {
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('PATCH', '/api/user/profile', {
      username: user.username,
      email: user.email,
    }, cookie);
    const res = await updateProfile(req);
    expect(res.status).toBe(200);
  });

  it('retourne 400 si username et email sont tous les deux absents', async () => {
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('PATCH', '/api/user/profile', {}, cookie);
    const res = await updateProfile(req);
    expect(res.status).toBe(400);
  });

  it('retourne 400 si l\'email fourni a un format invalide', async () => {
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('PATCH', '/api/user/profile', { email: 'not-an-email' }, cookie);
    const res = await updateProfile(req);
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/user/password', () => {
  it('retourne 401 sans session', async () => {
    const req = makeRequest('PATCH', '/api/user/password', {
      currentPassword: DEFAULT_PASSWORD,
      newPassword: 'NewPassword1!',
    });
    const res = await updatePassword(req);
    expect(res.status).toBe(401);
  });

  it('change le mot de passe avec l\'ancien correct', async () => {
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('PATCH', '/api/user/password', {
      currentPassword: DEFAULT_PASSWORD,
      newPassword: 'NewPassword1!',
    }, cookie);
    const res = await updatePassword(req);

    expect(res.status).toBe(200);
    const updated = await UserModel.findById(user._id);
    const ok = await verifyPassword(updated!.passwordHash, 'NewPassword1!');
    expect(ok).toBe(true);
  });

  it('refuse si l\'ancien mot de passe est incorrect', async () => {
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('PATCH', '/api/user/password', {
      currentPassword: 'WrongPassword1!',
      newPassword: 'NewPassword1!',
    }, cookie);
    const res = await updatePassword(req);

    expect(res.status).toBe(400);
    // Le mot de passe ne doit pas avoir changé
    const unchanged = await UserModel.findById(user._id);
    const stillOld = await verifyPassword(unchanged!.passwordHash, DEFAULT_PASSWORD);
    expect(stillOld).toBe(true);
  });

  it('refuse un nouveau mot de passe trop faible', async () => {
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('PATCH', '/api/user/password', {
      currentPassword: DEFAULT_PASSWORD,
      newPassword: 'weak',
    }, cookie);
    const res = await updatePassword(req);
    expect(res.status).toBe(400);
  });

  it('retourne 400 si currentPassword est absent', async () => {
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('PATCH', '/api/user/password', { newPassword: 'NewPassword1!' }, cookie);
    const res = await updatePassword(req);
    expect(res.status).toBe(400);
  });

  it('retourne 400 si newPassword est absent', async () => {
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('PATCH', '/api/user/password', { currentPassword: DEFAULT_PASSWORD }, cookie);
    const res = await updatePassword(req);
    expect(res.status).toBe(400);
  });

  it('accepte de réutiliser le même mot de passe', async () => {
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('PATCH', '/api/user/password', {
      currentPassword: DEFAULT_PASSWORD,
      newPassword: DEFAULT_PASSWORD,
    }, cookie);
    const res = await updatePassword(req);
    expect(res.status).toBe(200);
  });
});
