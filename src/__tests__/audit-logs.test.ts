import { describe, it, expect } from 'vitest';
import { GET as getAuditLogs } from '../../app/api/admin/audit-logs/route';
import AuditLogModel from '@models/AuditLog';
import { createTestUser, createAdminUser, createAuthCookie, makeRequest } from '../test/helpers';

describe('GET /api/admin/audit-logs', () => {
  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('GET', '/api/admin/audit-logs');
    const res = await getAuditLogs(req);
    expect(res.status).toBe(401);
  });

  it('retourne 401 avec un utilisateur non-admin', async () => {
    const user = await createTestUser({ username: 'audituser1', email: 'audituser1@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', '/api/admin/audit-logs', undefined, cookie);
    const res = await getAuditLogs(req);
    expect(res.status).toBe(401);
  });

  it('retourne 200 avec un tableau vide si pas de logs', async () => {
    const admin = await createAdminUser({ username: 'auditadmin1', email: 'auditadmin1@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('GET', '/api/admin/audit-logs', undefined, cookie);
    const res = await getAuditLogs(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data.logs)).toBe(true);
    expect(typeof data.total).toBe('number');
  });

  it('retourne les logs créés avec pagination', async () => {
    const admin = await createAdminUser({ username: 'auditadmin2', email: 'auditadmin2@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');

    await AuditLogModel.create([
      { action: 'USER_CREATED', userId: admin._id, username: 'auditadmin2', metadata: {} },
      { action: 'PASSWORD_CHANGED', userId: admin._id, username: 'auditadmin2', metadata: {} },
      { action: 'USER_UPDATED', userId: admin._id, username: 'auditadmin2', metadata: {} },
    ]);

    const req = makeRequest('GET', '/api/admin/audit-logs?limit=2&page=1', undefined, cookie);
    const res = await getAuditLogs(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.logs).toHaveLength(2);
    expect(data.total).toBeGreaterThanOrEqual(3);
    expect(data.pages).toBeGreaterThanOrEqual(2);
  });

  it('filtre par action', async () => {
    const admin = await createAdminUser({ username: 'auditadmin3', email: 'auditadmin3@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');

    await AuditLogModel.create([
      { action: 'USER_DELETED', userId: admin._id, username: 'auditadmin3', metadata: {} },
      { action: 'USER_CREATED', userId: admin._id, username: 'auditadmin3', metadata: {} },
    ]);

    const req = makeRequest('GET', '/api/admin/audit-logs?action=USER_DELETED', undefined, cookie);
    const res = await getAuditLogs(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.logs.every((l: { action: string }) => l.action === 'USER_DELETED')).toBe(true);
  });

  it('filtre par username', async () => {
    const admin = await createAdminUser({ username: 'auditadmin4', email: 'auditadmin4@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');

    await AuditLogModel.create({ action: 'USER_CREATED', userId: admin._id, username: 'uniqueuser-xyz', metadata: {} });

    const req = makeRequest('GET', '/api/admin/audit-logs?username=uniqueuser-xyz', undefined, cookie);
    const res = await getAuditLogs(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.logs.every((l: { username: string }) => l.username === 'uniqueuser-xyz')).toBe(true);
  });
});
