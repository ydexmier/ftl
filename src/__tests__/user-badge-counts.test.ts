import { describe, it, expect } from 'vitest';
import { GET as getBadgeCounts } from '../../app/api/user/badge-counts/route';
import GroupInvitationModel from '@models/GroupInvitation';
import { createTestUser, createAuthCookie, createTestGroup, makeRequest } from '../test/helpers';

// ─── GET /api/user/badge-counts ───────────────────────────────────────────────

describe('GET /api/user/badge-counts', () => {
  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('GET', '/api/user/badge-counts');
    const res = await getBadgeCounts(req);
    expect(res.status).toBe(401);
  });

  it('retourne groupInvitations à 0 si aucune invitation', async () => {
    const user = await createTestUser({ username: 'ubc_empty', email: 'ubc_empty@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', '/api/user/badge-counts', undefined, cookie);
    const res = await getBadgeCounts(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ groupInvitations: 0 });
  });

  it('compte les invitations PENDING reçues par l\'utilisateur', async () => {
    const admin = await createTestUser({ username: 'ubc_admin1', email: 'ubc_admin1@test.com' });
    const user = await createTestUser({ username: 'ubc_inv1', email: 'ubc_inv1@test.com' });
    const group = await createTestGroup(admin._id, { name: 'ubc-group-inv1' });
    const cookie = await createAuthCookie(user._id, 'USER');

    await GroupInvitationModel.create([
      { groupId: group._id, invitedUserId: user._id, invitedBy: admin._id, status: 'PENDING', expiresAt: new Date(Date.now() + 86400000) },
      { groupId: group._id, invitedUserId: admin._id, invitedBy: admin._id, status: 'PENDING', expiresAt: new Date(Date.now() + 86400000) },
    ]);

    const req = makeRequest('GET', '/api/user/badge-counts', undefined, cookie);
    const res = await getBadgeCounts(req);
    const data = await res.json();
    expect(data.groupInvitations).toBe(1);
  });

  it('ne compte pas les invitations expirées ou non-PENDING', async () => {
    const admin = await createTestUser({ username: 'ubc_admin2', email: 'ubc_admin2@test.com' });
    const user = await createTestUser({ username: 'ubc_inv2', email: 'ubc_inv2@test.com' });
    const group = await createTestGroup(admin._id, { name: 'ubc-group-inv2' });
    const cookie = await createAuthCookie(user._id, 'USER');

    await GroupInvitationModel.create([
      { groupId: group._id, invitedUserId: user._id, invitedBy: admin._id, status: 'ACCEPTED', expiresAt: new Date(Date.now() + 86400000) },
      { groupId: group._id, invitedUserId: user._id, invitedBy: admin._id, status: 'REJECTED', expiresAt: new Date(Date.now() + 86400000) },
    ]);

    const req = makeRequest('GET', '/api/user/badge-counts', undefined, cookie);
    const res = await getBadgeCounts(req);
    const data = await res.json();
    expect(data.groupInvitations).toBe(0);
  });

  it('compte plusieurs invitations PENDING reçues', async () => {
    const admin = await createTestUser({ username: 'ubc_admin3', email: 'ubc_admin3@test.com' });
    const user = await createTestUser({ username: 'ubc_inv3', email: 'ubc_inv3@test.com' });
    const group1 = await createTestGroup(admin._id, { name: 'ubc-group-inv3a' });
    const group2 = await createTestGroup(admin._id, { name: 'ubc-group-inv3b' });
    const cookie = await createAuthCookie(user._id, 'USER');

    await GroupInvitationModel.create([
      { groupId: group1._id, invitedUserId: user._id, invitedBy: admin._id, status: 'PENDING', expiresAt: new Date(Date.now() + 86400000) },
      { groupId: group2._id, invitedUserId: user._id, invitedBy: admin._id, status: 'PENDING', expiresAt: new Date(Date.now() + 86400000) },
    ]);

    const req = makeRequest('GET', '/api/user/badge-counts', undefined, cookie);
    const res = await getBadgeCounts(req);
    const data = await res.json();
    expect(data.groupInvitations).toBe(2);
  });
});
