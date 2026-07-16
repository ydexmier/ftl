import { describe, it, expect } from 'vitest';
import { GET as getBadgeCounts } from '../../app/api/admin/badge-counts/route';
import InvitationModel from '@models/Invitation';
import AccessRequestModel from '@models/AccessRequest';
import { createTestUser, createAdminUser, createAuthCookie, makeRequest } from '../test/helpers';

// ─── GET /api/admin/badge-counts ─────────────────────────────────────────────

describe('GET /api/admin/badge-counts', () => {
  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('GET', '/api/admin/badge-counts');
    const res = await getBadgeCounts(req);
    expect(res.status).toBe(401);
  });

  it('retourne 403 pour un USER', async () => {
    const user = await createTestUser({ username: 'bc_user1', email: 'bc_user1@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', '/api/admin/badge-counts', undefined, cookie);
    const res = await getBadgeCounts(req);
    expect(res.status).toBe(403);
  });

  it('retourne 200 avec tous les compteurs à 0 si la base est vide', async () => {
    const admin = await createAdminUser({ username: 'bc_admin1', email: 'bc_admin1@test.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('GET', '/api/admin/badge-counts', undefined, cookie);
    const res = await getBadgeCounts(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ invitations: 0, accessRequests: 0 });
  });

  it('compte uniquement les invitations PENDING', async () => {
    const admin = await createAdminUser({ username: 'bc_admin2', email: 'bc_admin2@test.com' });
    await InvitationModel.create([
      { email: 'a@test.com', token: crypto.randomUUID(), invitedBy: admin._id, expiresAt: new Date(Date.now() + 86400000), status: 'PENDING' },
      { email: 'b@test.com', token: crypto.randomUUID(), invitedBy: admin._id, expiresAt: new Date(Date.now() + 86400000), status: 'PENDING' },
      { email: 'c@test.com', token: crypto.randomUUID(), invitedBy: admin._id, expiresAt: new Date(Date.now() + 86400000), status: 'USED' },
      { email: 'd@test.com', token: crypto.randomUUID(), invitedBy: admin._id, expiresAt: new Date(Date.now() + 86400000), status: 'CANCELLED' },
      { email: 'e@test.com', token: crypto.randomUUID(), invitedBy: admin._id, expiresAt: new Date(Date.now() + 86400000), status: 'EXPIRED' },
    ]);
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('GET', '/api/admin/badge-counts', undefined, cookie);
    const res = await getBadgeCounts(req);
    const data = await res.json();
    expect(data.invitations).toBe(2);
  });

  it('compte uniquement les demandes d\'accès PENDING', async () => {
    const admin = await createAdminUser({ username: 'bc_admin3', email: 'bc_admin3@test.com' });
    await AccessRequestModel.create([
      { email: 'ar1@test.com', status: 'PENDING' },
      { email: 'ar2@test.com', status: 'PENDING' },
      { email: 'ar3@test.com', status: 'PENDING' },
      { email: 'ar4@test.com', status: 'APPROVED' },
      { email: 'ar5@test.com', status: 'REJECTED' },
    ]);
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('GET', '/api/admin/badge-counts', undefined, cookie);
    const res = await getBadgeCounts(req);
    const data = await res.json();
    expect(data.accessRequests).toBe(3);
  });

  it('retourne les 2 compteurs avec les bonnes valeurs simultanément', async () => {
    const admin = await createAdminUser({ username: 'bc_admin4', email: 'bc_admin4@test.com' });
    await InvitationModel.create([
      { email: 'x1@test.com', token: crypto.randomUUID(), invitedBy: admin._id, expiresAt: new Date(Date.now() + 86400000), status: 'PENDING' },
    ]);
    await AccessRequestModel.create([
      { email: 'y1@test.com', status: 'PENDING' },
      { email: 'y2@test.com', status: 'PENDING' },
    ]);
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('GET', '/api/admin/badge-counts', undefined, cookie);
    const res = await getBadgeCounts(req);
    const data = await res.json();
    expect(data).toEqual({ invitations: 1, accessRequests: 2 });
  });
});
