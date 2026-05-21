import { describe, it, expect } from 'vitest';
import { GET as listUsers, POST as createUser } from '../../app/api/admin/users/route';
import { GET as getUser, PATCH as updateUser, DELETE as deleteUser } from '../../app/api/admin/users/[id]/route';
import UserModel from '@models/User';
import SessionModel from '@models/Session';
import { createTestUser, createAdminUser, createAuthCookie, makeRequest } from '../test/helpers';

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('GET /api/admin/users', () => {
  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('GET', '/api/admin/users');
    const res = await listUsers(req);
    expect(res.status).toBe(401);
  });

  it('retourne 401 avec un utilisateur non-admin', async () => {
    const user = await createTestUser({ username: 'plain', email: 'plain@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', '/api/admin/users', undefined, cookie);
    const res = await listUsers(req);
    expect(res.status).toBe(401);
  });

  it('retourne 200 et la liste des utilisateurs pour un admin', async () => {
    const admin = await createAdminUser();
    await createTestUser({ username: 'u1', email: 'u1@example.com' });
    await createTestUser({ username: 'u2', email: 'u2@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');

    const req = makeRequest('GET', '/api/admin/users', undefined, cookie);
    const res = await listUsers(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(3);
    expect(Array.isArray(data.users)).toBe(true);
  });

  it('filtre par rôle', async () => {
    const admin = await createAdminUser({ username: 'adminfilter', email: 'adminfilter@example.com' });
    await createTestUser({ username: 'userfilter', email: 'userfilter@example.com', role: 'USER' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');

    const req = makeRequest('GET', '/api/admin/users?role=ADMIN', undefined, cookie);
    const res = await listUsers(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.users.every((u: { role: string }) => u.role === 'ADMIN')).toBe(true);
  });

  it('filtre par recherche', async () => {
    const admin = await createAdminUser({ username: 'adminsearch', email: 'adminsearch@example.com' });
    await createTestUser({ username: 'uniquenamexyz', email: 'uniquenamexyz@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');

    const req = makeRequest('GET', '/api/admin/users?search=uniquenamexyz', undefined, cookie);
    const res = await listUsers(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.users.some((u: { username: string }) => u.username === 'uniquenamexyz')).toBe(true);
  });
});

describe('POST /api/admin/users', () => {
  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('POST', '/api/admin/users', { username: 'x', email: 'x@x.com', password: 'StrongPass1!' });
    const res = await createUser(req);
    expect(res.status).toBe(401);
  });

  it('retourne 400 avec un mot de passe faible', async () => {
    const admin = await createAdminUser({ username: 'admincreate1', email: 'admincreate1@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('POST', '/api/admin/users', { username: 'newuser', email: 'new@example.com', password: 'weak' }, cookie);
    const res = await createUser(req);
    expect(res.status).toBe(400);
  });

  it('retourne 400 avec un email invalide', async () => {
    const admin = await createAdminUser({ username: 'admincreate2', email: 'admincreate2@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('POST', '/api/admin/users', { username: 'newuser2', email: 'not-an-email', password: 'StrongPass1!' }, cookie);
    const res = await createUser(req);
    expect(res.status).toBe(400);
  });

  it('retourne 409 si le username est déjà pris', async () => {
    const admin = await createAdminUser({ username: 'admincreate3', email: 'admincreate3@example.com' });
    await createTestUser({ username: 'taken', email: 'taken@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('POST', '/api/admin/users', { username: 'taken', email: 'other@example.com', password: 'StrongPass1!' }, cookie);
    const res = await createUser(req);
    expect(res.status).toBe(409);
  });

  it('retourne 409 si l\'email est déjà utilisé', async () => {
    const admin = await createAdminUser({ username: 'admincreate4', email: 'admincreate4@example.com' });
    await createTestUser({ username: 'emailowner', email: 'taken@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('POST', '/api/admin/users', { username: 'brandnew', email: 'taken@example.com', password: 'StrongPass1!' }, cookie);
    const res = await createUser(req);
    expect(res.status).toBe(409);
  });

  it('crée l\'utilisateur et retourne 201', async () => {
    const admin = await createAdminUser({ username: 'admincreate5', email: 'admincreate5@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('POST', '/api/admin/users', { username: 'brandnewuser', email: 'brandnew@example.com', password: 'StrongPass1!' }, cookie);
    const res = await createUser(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.username).toBe('brandnewuser');
    expect(data.role).toBe('USER');
    const created = await UserModel.findOne({ username: 'brandnewuser' });
    expect(created).not.toBeNull();
  });
});

describe('GET /api/admin/users/[id]', () => {
  it('retourne 401 sans cookie', async () => {
    const user = await createTestUser({ username: 'getu1', email: 'getu1@example.com' });
    const req = makeRequest('GET', `/api/admin/users/${user._id}`);
    const res = await getUser(req, params(String(user._id)));
    expect(res.status).toBe(401);
  });

  it('retourne 404 pour un id inconnu', async () => {
    const admin = await createAdminUser({ username: 'adminget1', email: 'adminget1@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const fakeId = new (await import('mongoose')).default.Types.ObjectId();
    const req = makeRequest('GET', `/api/admin/users/${fakeId}`, undefined, cookie);
    const res = await getUser(req, params(String(fakeId)));
    expect(res.status).toBe(404);
  });

  it('retourne 200 avec les données utilisateur, sessions actives et logs', async () => {
    const admin = await createAdminUser({ username: 'adminget2', email: 'adminget2@example.com' });
    const target = await createTestUser({ username: 'targetget', email: 'targetget@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');

    const req = makeRequest('GET', `/api/admin/users/${target._id}`, undefined, cookie);
    const res = await getUser(req, params(String(target._id)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user.username).toBe('targetget');
    expect(typeof data.activeSessions).toBe('number');
    expect(Array.isArray(data.recentLogs)).toBe(true);
  });
});

describe('PATCH /api/admin/users/[id]', () => {
  it('retourne 401 sans cookie', async () => {
    const user = await createTestUser({ username: 'patchu1', email: 'patchu1@example.com' });
    const req = makeRequest('PATCH', `/api/admin/users/${user._id}`, { username: 'newname' });
    const res = await updateUser(req, params(String(user._id)));
    expect(res.status).toBe(401);
  });

  it('retourne 404 pour un id inconnu', async () => {
    const admin = await createAdminUser({ username: 'adminpatch1', email: 'adminpatch1@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const fakeId = new (await import('mongoose')).default.Types.ObjectId();
    const req = makeRequest('PATCH', `/api/admin/users/${fakeId}`, { username: 'newname' }, cookie);
    const res = await updateUser(req, params(String(fakeId)));
    expect(res.status).toBe(404);
  });

  it('retourne 409 si le username cible est déjà pris', async () => {
    const admin = await createAdminUser({ username: 'adminpatch2', email: 'adminpatch2@example.com' });
    await createTestUser({ username: 'alreadytaken', email: 'alreadytaken@example.com' });
    const target = await createTestUser({ username: 'patchtarget', email: 'patchtarget@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');

    const req = makeRequest('PATCH', `/api/admin/users/${target._id}`, { username: 'alreadytaken' }, cookie);
    const res = await updateUser(req, params(String(target._id)));
    expect(res.status).toBe(409);
  });

  it('retourne 400 si le body de mise à jour est invalide (aucun champ)', async () => {
    const admin = await createAdminUser({ username: 'adminpatch4', email: 'adminpatch4@example.com' });
    const target = await createTestUser({ username: 'patchtarget2', email: 'patchtarget2@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');

    const req = makeRequest('PATCH', `/api/admin/users/${target._id}`, {}, cookie);
    const res = await updateUser(req, params(String(target._id)));
    expect(res.status).toBe(400);
  });

  it('retourne 409 si l\'email cible est déjà utilisé', async () => {
    const admin = await createAdminUser({ username: 'adminpatch5', email: 'adminpatch5@example.com' });
    await createTestUser({ username: 'emailowner2', email: 'taken2@example.com' });
    const target = await createTestUser({ username: 'patchtarget3', email: 'patchtarget3@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');

    const req = makeRequest('PATCH', `/api/admin/users/${target._id}`, { email: 'taken2@example.com' }, cookie);
    const res = await updateUser(req, params(String(target._id)));
    expect(res.status).toBe(409);
  });

  it('retourne 400 si le mot de passe est trop faible', async () => {
    const admin = await createAdminUser({ username: 'adminpatch6', email: 'adminpatch6@example.com' });
    const target = await createTestUser({ username: 'patchtarget4', email: 'patchtarget4@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');

    const req = makeRequest('PATCH', `/api/admin/users/${target._id}`, { password: 'weak' }, cookie);
    const res = await updateUser(req, params(String(target._id)));
    expect(res.status).toBe(400);
  });

  it('change le mot de passe avec un mot de passe fort et retourne 200', async () => {
    const admin = await createAdminUser({ username: 'adminpatch7', email: 'adminpatch7@example.com' });
    const target = await createTestUser({ username: 'patchtarget5', email: 'patchtarget5@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');

    const req = makeRequest('PATCH', `/api/admin/users/${target._id}`, { password: 'StrongPass1!' }, cookie);
    const res = await updateUser(req, params(String(target._id)));
    expect(res.status).toBe(200);
  });

  it('met à jour le rôle et retourne 200', async () => {
    const admin = await createAdminUser({ username: 'adminpatch3', email: 'adminpatch3@example.com' });
    const target = await createTestUser({ username: 'roletarget', email: 'roletarget@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');

    const req = makeRequest('PATCH', `/api/admin/users/${target._id}`, { role: 'ADMIN' }, cookie);
    const res = await updateUser(req, params(String(target._id)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user.role).toBe('ADMIN');
  });
});

describe('DELETE /api/admin/users/[id]', () => {
  it('retourne 401 sans cookie', async () => {
    const user = await createTestUser({ username: 'delu1', email: 'delu1@example.com' });
    const req = makeRequest('DELETE', `/api/admin/users/${user._id}`);
    const res = await deleteUser(req, params(String(user._id)));
    expect(res.status).toBe(401);
  });

  it('retourne 400 si l\'admin tente de se supprimer lui-même', async () => {
    const admin = await createAdminUser({ username: 'adminself', email: 'adminself@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');

    const req = makeRequest('DELETE', `/api/admin/users/${admin._id}`, undefined, cookie);
    const res = await deleteUser(req, params(String(admin._id)));
    expect(res.status).toBe(400);
  });

  it('retourne 404 pour un id inconnu', async () => {
    const admin = await createAdminUser({ username: 'admindel1', email: 'admindel1@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const fakeId = new (await import('mongoose')).default.Types.ObjectId();
    const req = makeRequest('DELETE', `/api/admin/users/${fakeId}`, undefined, cookie);
    const res = await deleteUser(req, params(String(fakeId)));
    expect(res.status).toBe(404);
  });

  it('supprime l\'utilisateur et ses sessions, retourne 204', async () => {
    const admin = await createAdminUser({ username: 'admindel2', email: 'admindel2@example.com' });
    const target = await createTestUser({ username: 'todelete', email: 'todelete@example.com' });
    await createAuthCookie(target._id, 'USER');
    const adminCookie = await createAuthCookie(admin._id, 'ADMIN');

    const sessionsBefore = await SessionModel.countDocuments({ userId: target._id });
    expect(sessionsBefore).toBe(1);

    const req = makeRequest('DELETE', `/api/admin/users/${target._id}`, undefined, adminCookie);
    const res = await deleteUser(req, params(String(target._id)));

    expect(res.status).toBe(204);
    const deleted = await UserModel.findById(target._id);
    expect(deleted).toBeNull();
    const sessionsAfter = await SessionModel.countDocuments({ userId: target._id });
    expect(sessionsAfter).toBe(0);
  });
});
