import { describe, it, expect } from 'vitest';
import { GET as getBadgeCounts } from '../../app/api/user/badge-counts/route';
import GroupInvitationModel from '@models/GroupInvitation';
import GroupTournamentModel from '@models/GroupTournament';
import { createTestUser, createAuthCookie, createTestGroup, makeRequest } from '../test/helpers';

// ─── GET /api/user/badge-counts ───────────────────────────────────────────────

describe('GET /api/user/badge-counts', () => {
  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('GET', '/api/user/badge-counts');
    const res = await getBadgeCounts(req);
    expect(res.status).toBe(401);
  });

  it('retourne tous les compteurs à 0 si aucune donnée', async () => {
    const user = await createTestUser({ username: 'ubc_empty', email: 'ubc_empty@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', '/api/user/badge-counts', undefined, cookie);
    const res = await getBadgeCounts(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ groupInvitations: 0, groupAdminInvitations: 0, newGroupTournaments: 0 });
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

  it('compte les invitations PENDING dans les groupes administrés par l\'utilisateur', async () => {
    const admin = await createTestUser({ username: 'ubc_groupadmin1', email: 'ubc_groupadmin1@test.com' });
    const member1 = await createTestUser({ username: 'ubc_m1', email: 'ubc_m1@test.com' });
    const member2 = await createTestUser({ username: 'ubc_m2', email: 'ubc_m2@test.com' });
    const group = await createTestGroup(admin._id, { name: 'ubc-admin-group1' });
    const cookie = await createAuthCookie(admin._id, 'USER');

    await GroupInvitationModel.create([
      { groupId: group._id, invitedUserId: member1._id, invitedBy: admin._id, status: 'PENDING', expiresAt: new Date(Date.now() + 86400000) },
      { groupId: group._id, invitedUserId: member2._id, invitedBy: admin._id, status: 'PENDING', expiresAt: new Date(Date.now() + 86400000) },
      { groupId: group._id, invitedUserId: member1._id, invitedBy: admin._id, status: 'ACCEPTED', expiresAt: new Date(Date.now() + 86400000) },
    ]);

    const req = makeRequest('GET', '/api/user/badge-counts', undefined, cookie);
    const res = await getBadgeCounts(req);
    const data = await res.json();
    expect(data.groupAdminInvitations).toBe(2);
  });

  it('ne compte pas les invitations admin de groupes dont l\'utilisateur est simple membre', async () => {
    const owner = await createTestUser({ username: 'ubc_owner1', email: 'ubc_owner1@test.com' });
    const user = await createTestUser({ username: 'ubc_simplemember', email: 'ubc_simplemember@test.com' });
    const invited = await createTestUser({ username: 'ubc_invited1', email: 'ubc_invited1@test.com' });
    const group = await createTestGroup(owner._id, { name: 'ubc-not-admin-group' });

    // Ajouter user comme MEMBER (pas ADMIN) dans ce groupe
    await group.updateOne({ $push: { members: { userId: user._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: owner._id } } });

    const cookie = await createAuthCookie(user._id, 'USER');

    await GroupInvitationModel.create(
      { groupId: group._id, invitedUserId: invited._id, invitedBy: owner._id, status: 'PENDING', expiresAt: new Date(Date.now() + 86400000) },
    );

    const req = makeRequest('GET', '/api/user/badge-counts', undefined, cookie);
    const res = await getBadgeCounts(req);
    const data = await res.json();
    expect(data.groupAdminInvitations).toBe(0);
  });

  it('compte les tournois ajoutés dans les 7 derniers jours pour les groupes de l\'utilisateur', async () => {
    const user = await createTestUser({ username: 'ubc_tour1', email: 'ubc_tour1@test.com' });
    const group = await createTestGroup(user._id, { name: 'ubc-group-tour1' });
    const cookie = await createAuthCookie(user._id, 'USER');

    const recentDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 jours
    const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);    // 8 jours
    await GroupTournamentModel.create([
      { groupId: group._id, tournamentId: 1001, addedBy: user._id, status: 'ACTIVE', createdAt: recentDate },
      { groupId: group._id, tournamentId: 1002, addedBy: user._id, status: 'ACTIVE', createdAt: recentDate },
      { groupId: group._id, tournamentId: 1003, addedBy: user._id, status: 'ACTIVE', createdAt: oldDate },
      { groupId: group._id, tournamentId: 1004, addedBy: user._id, status: 'ARCHIVED', createdAt: recentDate },
    ]);

    const req = makeRequest('GET', '/api/user/badge-counts', undefined, cookie);
    const res = await getBadgeCounts(req);
    const data = await res.json();
    expect(data.newGroupTournaments).toBe(2);
  });

  it('ne compte pas les tournois des groupes auxquels l\'utilisateur n\'appartient pas', async () => {
    const user = await createTestUser({ username: 'ubc_notmember', email: 'ubc_notmember@test.com' });
    const owner = await createTestUser({ username: 'ubc_owner2', email: 'ubc_owner2@test.com' });
    const group = await createTestGroup(owner._id, { name: 'ubc-other-group' });
    const cookie = await createAuthCookie(user._id, 'USER');

    await GroupTournamentModel.create(
      { groupId: group._id, tournamentId: 2001, addedBy: owner._id, status: 'ACTIVE', createdAt: new Date() },
    );

    const req = makeRequest('GET', '/api/user/badge-counts', undefined, cookie);
    const res = await getBadgeCounts(req);
    const data = await res.json();
    expect(data.newGroupTournaments).toBe(0);
  });

  it('retourne les 3 compteurs combinés correctement', async () => {
    const admin = await createTestUser({ username: 'ubc_combined', email: 'ubc_combined@test.com' });
    const invitee = await createTestUser({ username: 'ubc_combined_inv', email: 'ubc_combined_inv@test.com' });
    const group = await createTestGroup(admin._id, { name: 'ubc-combined-group' });
    const cookie = await createAuthCookie(admin._id, 'USER');

    // 1 invitation reçue par admin depuis un autre groupe
    const otherGroup = await createTestGroup(invitee._id, { name: 'ubc-other-combined' });
    await GroupInvitationModel.create(
      { groupId: otherGroup._id, invitedUserId: admin._id, invitedBy: invitee._id, status: 'PENDING', expiresAt: new Date(Date.now() + 86400000) },
    );

    // 1 invitation admin en attente
    await GroupInvitationModel.create(
      { groupId: group._id, invitedUserId: invitee._id, invitedBy: admin._id, status: 'PENDING', expiresAt: new Date(Date.now() + 86400000) },
    );

    // 2 nouveaux tournois
    await GroupTournamentModel.create([
      { groupId: group._id, tournamentId: 3001, addedBy: admin._id, status: 'ACTIVE' },
      { groupId: group._id, tournamentId: 3002, addedBy: admin._id, status: 'ACTIVE' },
    ]);

    const req = makeRequest('GET', '/api/user/badge-counts', undefined, cookie);
    const res = await getBadgeCounts(req);
    const data = await res.json();
    expect(data.groupInvitations).toBe(1);
    expect(data.groupAdminInvitations).toBe(1);
    expect(data.newGroupTournaments).toBe(2);
  });
});
