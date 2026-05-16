import { describe, it, expect } from 'vitest';
import { GET as getGroupTournaments, POST as addTournament } from '../../app/api/groups/[id]/tournaments/route';
import { DELETE as removeTournament } from '../../app/api/groups/[id]/tournaments/[tid]/route';
import { GET as getExternalAccesses, POST as inviteExternal } from '../../app/api/groups/[id]/tournaments/[tid]/external-access/route';
import { PUT as respondToExternalAccess } from '../../app/api/groups/external-access/[accessId]/route';
import { GET as getMyInvitations } from '../../app/api/groups/invitations/route';
import { PUT as respondToInvitation } from '../../app/api/groups/invitations/[invId]/route';
import TournamentModel from '@models/Tournament';
import GroupInvitationModel from '@models/GroupInvitation';
import GroupModel from '@models/Group';
import { createTestUser, createAuthCookie, createTestGroup, makeRequest } from '../test/helpers';

let _tournamentCounter = 0;
async function createTestTournament() {
  _tournamentCounter++;
  return TournamentModel.create({
    id: 900000 + _tournamentCounter,
    name: `Test Tournament ${_tournamentCounter}`,
    event_status: 'ENDED',
    start_datetime: new Date(),
    tournament_phases: [],
  });
}

function groupParams(id: string) {
  return { params: Promise.resolve({ id }) };
}
function tournamentParams(id: string, tid: string) {
  return { params: Promise.resolve({ id, tid }) };
}
function accessParams(accessId: string) {
  return { params: Promise.resolve({ accessId }) };
}
function invParams(invId: string) {
  return { params: Promise.resolve({ invId }) };
}

// ─── Group Tournaments ─────────────────────────────────────────────────────

describe('GET /api/groups/[id]/tournaments', () => {
  it('retourne 401 sans cookie', async () => {
    const owner = await createTestUser({ username: 'gtt1', email: 'gtt1@example.com' });
    const group = await createTestGroup(owner._id);
    const req = makeRequest('GET', `/api/groups/${group._id}/tournaments`);
    const res = await getGroupTournaments(req, groupParams(String(group._id)));
    expect(res.status).toBe(401);
  });

  it('retourne 403 si l\'utilisateur n\'est pas membre', async () => {
    const owner = await createTestUser({ username: 'gtt2', email: 'gtt2@example.com' });
    const outsider = await createTestUser({ username: 'gtt3', email: 'gtt3@example.com' });
    const group = await createTestGroup(owner._id, { name: 'gt-group-1' });
    const cookie = await createAuthCookie(outsider._id, 'USER');
    const req = makeRequest('GET', `/api/groups/${group._id}/tournaments`, undefined, cookie);
    const res = await getGroupTournaments(req, groupParams(String(group._id)));
    expect(res.status).toBe(403);
  });

  it('retourne 200 avec la liste des tournois du groupe', async () => {
    const owner = await createTestUser({ username: 'gtt4', email: 'gtt4@example.com' });
    const group = await createTestGroup(owner._id, { name: 'gt-group-2' });
    const cookie = await createAuthCookie(owner._id, 'USER');
    const req = makeRequest('GET', `/api/groups/${group._id}/tournaments`, undefined, cookie);
    const res = await getGroupTournaments(req, groupParams(String(group._id)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data.tournaments)).toBe(true);
  });
});

describe('POST /api/groups/[id]/tournaments', () => {
  it('retourne 401 sans cookie', async () => {
    const owner = await createTestUser({ username: 'gta1', email: 'gta1@example.com' });
    const group = await createTestGroup(owner._id);
    const req = makeRequest('POST', `/api/groups/${group._id}/tournaments`, { tournamentId: 1 });
    const res = await addTournament(req, groupParams(String(group._id)));
    expect(res.status).toBe(401);
  });

  it('retourne 403 si l\'utilisateur n\'est pas admin du groupe', async () => {
    const owner = await createTestUser({ username: 'gta2', email: 'gta2@example.com' });
    const member = await createTestUser({ username: 'gta3', email: 'gta3@example.com' });
    const group = await createTestGroup(owner._id, { name: 'gt-group-3' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: member._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: owner._id } },
    });
    const cookie = await createAuthCookie(member._id, 'USER');
    const req = makeRequest('POST', `/api/groups/${group._id}/tournaments`, { tournamentId: 1 }, cookie);
    const res = await addTournament(req, groupParams(String(group._id)));
    expect(res.status).toBe(403);
  });

  it('retourne 400 si le tournoi n\'existe pas', async () => {
    const owner = await createTestUser({ username: 'gta4', email: 'gta4@example.com' });
    const group = await createTestGroup(owner._id, { name: 'gt-group-4' });
    const cookie = await createAuthCookie(owner._id, 'USER');
    const req = makeRequest('POST', `/api/groups/${group._id}/tournaments`, { tournamentId: 999999 }, cookie);
    const res = await addTournament(req, groupParams(String(group._id)));
    expect(res.status).toBe(400);
  });

  it('ajoute un tournoi et retourne 201', async () => {
    const owner = await createTestUser({ username: 'gta5', email: 'gta5@example.com' });
    const group = await createTestGroup(owner._id, { name: 'gt-group-5' });
    const tournament = await createTestTournament();
    const cookie = await createAuthCookie(owner._id, 'USER');
    const req = makeRequest('POST', `/api/groups/${group._id}/tournaments`, { tournamentId: tournament.id }, cookie);
    const res = await addTournament(req, groupParams(String(group._id)));
    expect(res.status).toBe(201);
  });

  it('retourne 400 si le tournoi est déjà dans le groupe', async () => {
    const owner = await createTestUser({ username: 'gta6', email: 'gta6@example.com' });
    const group = await createTestGroup(owner._id, { name: 'gt-group-6' });
    const tournament = await createTestTournament();
    const cookie = await createAuthCookie(owner._id, 'USER');
    const req1 = makeRequest('POST', `/api/groups/${group._id}/tournaments`, { tournamentId: tournament.id }, cookie);
    await addTournament(req1, groupParams(String(group._id)));
    const req2 = makeRequest('POST', `/api/groups/${group._id}/tournaments`, { tournamentId: tournament.id }, cookie);
    const res = await addTournament(req2, groupParams(String(group._id)));
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/groups/[id]/tournaments/[tid]', () => {
  it('retourne 401 sans cookie', async () => {
    const owner = await createTestUser({ username: 'gtd1', email: 'gtd1@example.com' });
    const group = await createTestGroup(owner._id);
    const req = makeRequest('DELETE', `/api/groups/${group._id}/tournaments/1`);
    const res = await removeTournament(req, tournamentParams(String(group._id), '1'));
    expect(res.status).toBe(401);
  });

  it('retire un tournoi et retourne 200', async () => {
    const owner = await createTestUser({ username: 'gtd2', email: 'gtd2@example.com' });
    const group = await createTestGroup(owner._id, { name: 'gt-group-7' });
    const tournament = await createTestTournament();
    const cookie = await createAuthCookie(owner._id, 'USER');
    const addReq = makeRequest('POST', `/api/groups/${group._id}/tournaments`, { tournamentId: tournament.id }, cookie);
    await addTournament(addReq, groupParams(String(group._id)));
    const delReq = makeRequest('DELETE', `/api/groups/${group._id}/tournaments/${tournament.id}`, undefined, cookie);
    const res = await removeTournament(delReq, tournamentParams(String(group._id), String(tournament.id)));
    expect(res.status).toBe(200);
  });
});

// ─── Group Invitations ─────────────────────────────────────────────────────

describe('GET /api/groups/invitations', () => {
  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('GET', '/api/groups/invitations');
    const res = await getMyInvitations(req);
    expect(res.status).toBe(401);
  });

  it('retourne les invitations en attente de l\'utilisateur', async () => {
    const owner = await createTestUser({ username: 'ginv1', email: 'ginv1@example.com' });
    const invited = await createTestUser({ username: 'ginv2', email: 'ginv2@example.com' });
    const group = await createTestGroup(owner._id, { name: 'inv-grp-1' });
    await GroupInvitationModel.create({
      groupId: group._id,
      invitedUserId: invited._id,
      invitedBy: owner._id,
      expiresAt: new Date(Date.now() + 86400000),
    });
    const cookie = await createAuthCookie(invited._id, 'USER');
    const req = makeRequest('GET', '/api/groups/invitations', undefined, cookie);
    const res = await getMyInvitations(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.invitations.length).toBeGreaterThanOrEqual(1);
  });
});

describe('PUT /api/groups/invitations/[invId]', () => {
  it('retourne 401 sans cookie', async () => {
    const owner = await createTestUser({ username: 'ginvr1', email: 'ginvr1@example.com' });
    const invited = await createTestUser({ username: 'ginvr2', email: 'ginvr2@example.com' });
    const group = await createTestGroup(owner._id, { name: 'inv-grp-2' });
    const inv = await GroupInvitationModel.create({
      groupId: group._id, invitedUserId: invited._id, invitedBy: owner._id,
      expiresAt: new Date(Date.now() + 86400000),
    });
    const req = makeRequest('PUT', `/api/groups/invitations/${inv._id}`, { status: 'ACCEPTED' });
    const res = await respondToInvitation(req, invParams(String(inv._id)));
    expect(res.status).toBe(401);
  });

  it('retourne 400 pour un statut invalide', async () => {
    const owner = await createTestUser({ username: 'ginvr3', email: 'ginvr3@example.com' });
    const invited = await createTestUser({ username: 'ginvr4', email: 'ginvr4@example.com' });
    const group = await createTestGroup(owner._id, { name: 'inv-grp-3' });
    const inv = await GroupInvitationModel.create({
      groupId: group._id, invitedUserId: invited._id, invitedBy: owner._id,
      expiresAt: new Date(Date.now() + 86400000),
    });
    const cookie = await createAuthCookie(invited._id, 'USER');
    const req = makeRequest('PUT', `/api/groups/invitations/${inv._id}`, { status: 'MAYBE' }, cookie);
    const res = await respondToInvitation(req, invParams(String(inv._id)));
    expect(res.status).toBe(400);
  });

  it('accepte une invitation et ajoute l\'utilisateur au groupe', async () => {
    const owner = await createTestUser({ username: 'ginvr5', email: 'ginvr5@example.com' });
    const invited = await createTestUser({ username: 'ginvr6', email: 'ginvr6@example.com' });
    const group = await createTestGroup(owner._id, { name: 'inv-grp-4' });
    const inv = await GroupInvitationModel.create({
      groupId: group._id, invitedUserId: invited._id, invitedBy: owner._id,
      expiresAt: new Date(Date.now() + 86400000),
    });
    const cookie = await createAuthCookie(invited._id, 'USER');
    const req = makeRequest('PUT', `/api/groups/invitations/${inv._id}`, { status: 'ACCEPTED' }, cookie);
    const res = await respondToInvitation(req, invParams(String(inv._id)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('ACCEPTED');
    const updated = await GroupModel.findById(group._id);
    expect(updated!.members.some((m) => String(m.userId) === String(invited._id))).toBe(true);
  });

  it('rejette une invitation et ne modifie pas le groupe', async () => {
    const owner = await createTestUser({ username: 'ginvr7', email: 'ginvr7@example.com' });
    const invited = await createTestUser({ username: 'ginvr8', email: 'ginvr8@example.com' });
    const group = await createTestGroup(owner._id, { name: 'inv-grp-5' });
    const inv = await GroupInvitationModel.create({
      groupId: group._id, invitedUserId: invited._id, invitedBy: owner._id,
      expiresAt: new Date(Date.now() + 86400000),
    });
    const cookie = await createAuthCookie(invited._id, 'USER');
    const req = makeRequest('PUT', `/api/groups/invitations/${inv._id}`, { status: 'REJECTED' }, cookie);
    const res = await respondToInvitation(req, invParams(String(inv._id)));
    expect(res.status).toBe(200);
    const updated = await GroupModel.findById(group._id);
    expect(updated!.members.some((m) => String(m.userId) === String(invited._id))).toBe(false);
  });

  it('retourne 400 si l\'invitation a expiré', async () => {
    const owner = await createTestUser({ username: 'ginvr9', email: 'ginvr9@example.com' });
    const invited = await createTestUser({ username: 'ginvr10', email: 'ginvr10@example.com' });
    const group = await createTestGroup(owner._id, { name: 'inv-grp-6' });
    const inv = await GroupInvitationModel.create({
      groupId: group._id, invitedUserId: invited._id, invitedBy: owner._id,
      expiresAt: new Date(Date.now() - 1000),
    });
    const cookie = await createAuthCookie(invited._id, 'USER');
    const req = makeRequest('PUT', `/api/groups/invitations/${inv._id}`, { status: 'ACCEPTED' }, cookie);
    const res = await respondToInvitation(req, invParams(String(inv._id)));
    expect(res.status).toBe(400);
  });
});

// ─── External Access ───────────────────────────────────────────────────────

describe('GET /api/groups/[id]/tournaments/[tid]/external-access', () => {
  it('retourne 401 sans cookie', async () => {
    const owner = await createTestUser({ username: 'ext1', email: 'ext1@example.com' });
    const group = await createTestGroup(owner._id);
    const req = makeRequest('GET', `/api/groups/${group._id}/tournaments/1/external-access`);
    const res = await getExternalAccesses(req, tournamentParams(String(group._id), '1'));
    expect(res.status).toBe(401);
  });

  it('retourne 403 si l\'utilisateur n\'est pas admin', async () => {
    const owner = await createTestUser({ username: 'ext2', email: 'ext2@example.com' });
    const member = await createTestUser({ username: 'ext3', email: 'ext3@example.com' });
    const group = await createTestGroup(owner._id, { name: 'ext-group-1' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: member._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: owner._id } },
    });
    const cookie = await createAuthCookie(member._id, 'USER');
    const req = makeRequest('GET', `/api/groups/${group._id}/tournaments/1/external-access`, undefined, cookie);
    const res = await getExternalAccesses(req, tournamentParams(String(group._id), '1'));
    expect(res.status).toBe(403);
  });

  it('retourne 200 avec la liste des accès pour un admin', async () => {
    const owner = await createTestUser({ username: 'ext4', email: 'ext4@example.com' });
    const group = await createTestGroup(owner._id, { name: 'ext-group-2' });
    const tournament = await createTestTournament();
    const addReq = makeRequest('POST', `/api/groups/${group._id}/tournaments`, { tournamentId: tournament.id }, await createAuthCookie(owner._id, 'USER'));
    await addTournament(addReq, groupParams(String(group._id)));
    const cookie = await createAuthCookie(owner._id, 'USER');
    const req = makeRequest('GET', `/api/groups/${group._id}/tournaments/${tournament.id}/external-access`, undefined, cookie);
    const res = await getExternalAccesses(req, tournamentParams(String(group._id), String(tournament.id)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data.accesses)).toBe(true);
  });
});

describe('POST /api/groups/[id]/tournaments/[tid]/external-access', () => {
  it('retourne 400 si l\'utilisateur invité n\'existe pas', async () => {
    const owner = await createTestUser({ username: 'ext5', email: 'ext5@example.com' });
    const group = await createTestGroup(owner._id, { name: 'ext-group-3' });
    const tournament = await createTestTournament();
    const cookie = await createAuthCookie(owner._id, 'USER');
    const addReq = makeRequest('POST', `/api/groups/${group._id}/tournaments`, { tournamentId: tournament.id }, cookie);
    await addTournament(addReq, groupParams(String(group._id)));
    const fakeId = new (await import('mongoose')).default.Types.ObjectId();
    const req = makeRequest('POST', `/api/groups/${group._id}/tournaments/${tournament.id}/external-access`, { userId: String(fakeId) }, cookie);
    const res = await inviteExternal(req, tournamentParams(String(group._id), String(tournament.id)));
    expect(res.status).toBe(400);
  });

  it('crée un accès externe et retourne 201', async () => {
    const owner = await createTestUser({ username: 'ext6', email: 'ext6@example.com' });
    const external = await createTestUser({ username: 'ext7', email: 'ext7@example.com' });
    const group = await createTestGroup(owner._id, { name: 'ext-group-4' });
    const tournament = await createTestTournament();
    const cookie = await createAuthCookie(owner._id, 'USER');
    const addReq = makeRequest('POST', `/api/groups/${group._id}/tournaments`, { tournamentId: tournament.id }, cookie);
    await addTournament(addReq, groupParams(String(group._id)));
    const req = makeRequest('POST', `/api/groups/${group._id}/tournaments/${tournament.id}/external-access`, {
      userId: String(external._id),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    }, cookie);
    const res = await inviteExternal(req, tournamentParams(String(group._id), String(tournament.id)));
    expect(res.status).toBe(201);
  });

  it('retourne 409 si l\'utilisateur est déjà membre du groupe', async () => {
    const owner = await createTestUser({ username: 'ext10', email: 'ext10@example.com' });
    const member = await createTestUser({ username: 'ext11', email: 'ext11@example.com' });
    const group = await createTestGroup(owner._id, { name: 'ext-group-6' });
    const tournament = await createTestTournament();
    const GroupModelLocal = (await import('@models/Group')).default;
    await GroupModelLocal.findByIdAndUpdate(group._id, {
      $push: { members: { userId: member._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: owner._id } },
    });
    const cookie = await createAuthCookie(owner._id, 'USER');
    const addReq = makeRequest('POST', `/api/groups/${group._id}/tournaments`, { tournamentId: tournament.id }, cookie);
    await addTournament(addReq, groupParams(String(group._id)));
    const req = makeRequest('POST', `/api/groups/${group._id}/tournaments/${tournament.id}/external-access`, {
      userId: String(member._id),
    }, cookie);
    const res = await inviteExternal(req, tournamentParams(String(group._id), String(tournament.id)));
    expect(res.status).toBe(409);
  });
});

describe('PUT /api/groups/external-access/[accessId]', () => {
  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('PUT', '/api/groups/external-access/fakeid', { status: 'ACCEPTED' });
    const res = await respondToExternalAccess(req, accessParams('fakeid'));
    expect(res.status).toBe(401);
  });

  it('accepte un accès externe', async () => {
    const owner = await createTestUser({ username: 'ext8', email: 'ext8@example.com' });
    const external = await createTestUser({ username: 'ext9', email: 'ext9@example.com' });
    const group = await createTestGroup(owner._id, { name: 'ext-group-5' });
    const tournament = await createTestTournament();
    const ownerCookie = await createAuthCookie(owner._id, 'USER');
    const addReq = makeRequest('POST', `/api/groups/${group._id}/tournaments`, { tournamentId: tournament.id }, ownerCookie);
    await addTournament(addReq, groupParams(String(group._id)));
    const invReq = makeRequest('POST', `/api/groups/${group._id}/tournaments/${tournament.id}/external-access`, {
      userId: String(external._id),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    }, ownerCookie);
    const invRes = await inviteExternal(invReq, tournamentParams(String(group._id), String(tournament.id)));
    const invData = await invRes.json();

    const extCookie = await createAuthCookie(external._id, 'USER');
    const req = makeRequest('PUT', `/api/groups/external-access/${invData._id}`, { status: 'ACCEPTED' }, extCookie);
    const res = await respondToExternalAccess(req, accessParams(String(invData._id)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('ACCEPTED');
  });
});
