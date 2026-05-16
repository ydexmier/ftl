import { describe, it, expect } from 'vitest';
import { DELETE as revokeSessions } from '../../app/api/admin/users/[id]/sessions/route';
import { GET as getStats } from '../../app/api/admin/stats/route';
import { GET as getAdminGroups } from '../../app/api/admin/groups/route';
import { createTestUser, createAdminUser, createAuthCookie, createTestGroup, makeRequest } from '../test/helpers';
import SessionModel from '@models/Session';
import AuditLogModel from '@models/AuditLog';

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ─── DELETE /api/admin/users/[id]/sessions ────────────────────────────────────

describe('DELETE /api/admin/users/[id]/sessions', () => {
  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('DELETE', '/api/admin/users/123/sessions');
    const res = await revokeSessions(req, params('123'));
    expect(res.status).toBe(401);
  });

  it('retourne 401 pour un utilisateur non-admin', async () => {
    const user = await createTestUser({ username: 'revokeuser1', email: 'revokeuser1@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('DELETE', `/api/admin/users/${user._id}/sessions`, undefined, cookie);
    const res = await revokeSessions(req, params(String(user._id)));
    expect(res.status).toBe(401);
  });

  it('retourne 404 si l\'utilisateur cible n\'existe pas', async () => {
    const admin = await createAdminUser({ username: 'revokeadmin1', email: 'revokeadmin1@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const fakeId = '000000000000000000000001';
    const req = makeRequest('DELETE', `/api/admin/users/${fakeId}/sessions`, undefined, cookie);
    const res = await revokeSessions(req, params(fakeId));
    expect(res.status).toBe(404);
  });

  it('révoque toutes les sessions et retourne 204', async () => {
    const admin = await createAdminUser({ username: 'revokeadmin2', email: 'revokeadmin2@example.com' });
    const target = await createTestUser({ username: 'revoketarget1', email: 'revoketarget1@example.com' });

    await createAuthCookie(target._id, 'USER');
    await createAuthCookie(target._id, 'USER');
    const sessionsBefore = await SessionModel.countDocuments({ userId: target._id });
    expect(sessionsBefore).toBe(2);

    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('DELETE', `/api/admin/users/${target._id}/sessions`, undefined, cookie);
    const res = await revokeSessions(req, params(String(target._id)));
    expect(res.status).toBe(204);

    const sessionsAfter = await SessionModel.countDocuments({ userId: target._id });
    expect(sessionsAfter).toBe(0);
  });

  it('crée un audit log après révocation', async () => {
    const admin = await createAdminUser({ username: 'revokeadmin3', email: 'revokeadmin3@example.com' });
    const target = await createTestUser({ username: 'revoketarget2', email: 'revoketarget2@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('DELETE', `/api/admin/users/${target._id}/sessions`, undefined, cookie);
    await revokeSessions(req, params(String(target._id)));

    const log = await AuditLogModel.findOne({ action: 'ADMIN_ACTION', username: 'revokeadmin3' });
    expect(log).not.toBeNull();
    expect((log!.metadata as { action: string }).action).toBe('REVOKE_SESSIONS');
  });
});

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────

describe('GET /api/admin/stats', () => {
  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('GET', '/api/admin/stats');
    const res = await getStats(req);
    expect(res.status).toBe(401);
  });

  it('retourne 401 pour un non-admin', async () => {
    const user = await createTestUser({ username: 'statsuser1', email: 'statsuser1@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', '/api/admin/stats', undefined, cookie);
    const res = await getStats(req);
    expect(res.status).toBe(401);
  });

  it('retourne 200 avec la structure des stats', async () => {
    const admin = await createAdminUser({ username: 'statsadmin1', email: 'statsadmin1@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('GET', '/api/admin/stats', undefined, cookie);
    const res = await getStats(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(typeof data.today.logins).toBe('number');
    expect(typeof data.today.failures).toBe('number');
    expect(typeof data.week.logins).toBe('number');
    expect(typeof data.week.failures).toBe('number');
    expect(Array.isArray(data.suspiciousIPs)).toBe(true);
    expect(Array.isArray(data.recentFails)).toBe(true);
  });

  it('comptabilise les logins du jour', async () => {
    const admin = await createAdminUser({ username: 'statsadmin2', email: 'statsadmin2@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');

    await AuditLogModel.create([
      { action: 'LOGIN_SUCCESS', userId: admin._id, username: 'statsadmin2', metadata: {} },
      { action: 'LOGIN_SUCCESS', userId: admin._id, username: 'statsadmin2', metadata: {} },
      { action: 'LOGIN_FAIL', userId: admin._id, username: 'statsadmin2', metadata: {} },
    ]);

    const req = makeRequest('GET', '/api/admin/stats', undefined, cookie);
    const res = await getStats(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.today.logins).toBeGreaterThanOrEqual(2);
    expect(data.today.failures).toBeGreaterThanOrEqual(1);
  });
});

// ─── GET /api/admin/groups ────────────────────────────────────────────────────

describe('GET /api/admin/groups', () => {
  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('GET', '/api/admin/groups');
    const res = await getAdminGroups(req);
    expect(res.status).toBe(401);
  });

  it('retourne 403 pour un non-admin', async () => {
    const user = await createTestUser({ username: 'admingrpuser1', email: 'admingrpuser1@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', '/api/admin/groups', undefined, cookie);
    const res = await getAdminGroups(req);
    expect(res.status).toBe(403);
  });

  it('retourne 200 avec un tableau vide si pas de groupes', async () => {
    const admin = await createAdminUser({ username: 'admingrpadmin1', email: 'admingrpadmin1@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('GET', '/api/admin/groups', undefined, cookie);
    const res = await getAdminGroups(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data.groups)).toBe(true);
  });

  it('retourne la liste des groupes avec _id et name', async () => {
    const admin = await createAdminUser({ username: 'admingrpadmin2', email: 'admingrpadmin2@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');

    await createTestGroup(admin._id, { name: 'Groupe Alpha' });
    await createTestGroup(admin._id, { name: 'Groupe Beta' });

    const req = makeRequest('GET', '/api/admin/groups', undefined, cookie);
    const res = await getAdminGroups(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.groups.length).toBeGreaterThanOrEqual(2);
    const names = data.groups.map((g: { name: string }) => g.name);
    expect(names).toContain('Groupe Alpha');
    expect(names).toContain('Groupe Beta');
    data.groups.forEach((g: { _id: string; name: string }) => {
      expect(typeof g._id).toBe('string');
      expect(typeof g.name).toBe('string');
    });
  });

  it('retourne les groupes triés par nom', async () => {
    const admin = await createAdminUser({ username: 'admingrpadmin3', email: 'admingrpadmin3@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');

    await createTestGroup(admin._id, { name: 'Zeta Group' });
    await createTestGroup(admin._id, { name: 'Alpha Group' });

    const req = makeRequest('GET', '/api/admin/groups', undefined, cookie);
    const res = await getAdminGroups(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    const names: string[] = data.groups.map((g: { name: string }) => g.name);
    const alphaIdx = names.indexOf('Alpha Group');
    const zetaIdx = names.indexOf('Zeta Group');
    expect(alphaIdx).toBeLessThan(zetaIdx);
  });
});
