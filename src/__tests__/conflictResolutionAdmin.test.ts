import { describe, it, expect } from 'vitest';
import { GET as getGroupConflicts } from '../../app/api/groups/[id]/conflicts/route';
import { PATCH as patchGroupConflict } from '../../app/api/groups/[id]/conflicts/[conflictId]/route';
import TournamentConflictModel from '@models/TournamentConflict';
import TournamentPlayersDeckModel from '@models/TournamentPlayersDeck';
import GroupModel from '@models/Group';
import { createTestUser, createAuthCookie, createTestGroup, makeRequest } from '../test/helpers';

let _counter = 0;
function nextTid() { return 600000 + ++_counter; }

function groupConflictParams(id: string) {
  return { params: Promise.resolve({ id }) };
}
function conflictParams(id: string, conflictId: string) {
  return { params: Promise.resolve({ id, conflictId }) };
}

async function seedConflict(opts: {
  userId: string;
  groupId: string;
  tournamentId: number;
  status?: string;
  previousInks?: string[][];
  proposedInks?: string[][];
}) {
  return TournamentConflictModel.create({
    userId: opts.userId,
    groupId: opts.groupId,
    tournamentId: opts.tournamentId,
    playerId: 1,
    playerName: 'Player One',
    previousInks: opts.previousInks ?? [['Amber', 'Sapphire']],
    proposedInks: opts.proposedInks ?? [['Steel', 'Ruby']],
    status: opts.status ?? 'PENDING_ADMIN',
  });
}

// ─── GET /api/groups/[id]/conflicts ──────────────────────────────────────

describe('GET /api/groups/[id]/conflicts', () => {
  it('retourne 401 sans session', async () => {
    const req = makeRequest('GET', '/api/groups/g1/conflicts');
    const res = await getGroupConflicts(req, groupConflictParams('g1'));
    expect(res.status).toBe(401);
  });

  it('retourne 403 si l\'utilisateur n\'est pas admin du groupe', async () => {
    const admin = await createTestUser({ username: 'ca1', email: 'ca1@test.com' });
    const member = await createTestUser({ username: 'ca2', email: 'ca2@test.com' });
    const group = await createTestGroup(admin._id, { name: 'ca-grp-1' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: member._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: admin._id } },
    });

    const cookie = await createAuthCookie(member._id, 'USER');
    const req = makeRequest('GET', `/api/groups/${group._id}/conflicts`, undefined, cookie);
    const res = await getGroupConflicts(req, groupConflictParams(String(group._id)));
    expect(res.status).toBe(403);
  });

  it('retourne 200 avec liste vide si aucun conflit PENDING_ADMIN', async () => {
    const admin = await createTestUser({ username: 'ca3', email: 'ca3@test.com' });
    const group = await createTestGroup(admin._id, { name: 'ca-grp-2' });
    const cookie = await createAuthCookie(admin._id, 'USER');
    const req = makeRequest('GET', `/api/groups/${group._id}/conflicts`, undefined, cookie);
    const res = await getGroupConflicts(req, groupConflictParams(String(group._id)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.conflicts).toEqual([]);
  });

  it('retourne uniquement les conflits PENDING_ADMIN du groupe', async () => {
    const admin = await createTestUser({ username: 'ca4', email: 'ca4@test.com' });
    const member = await createTestUser({ username: 'ca5', email: 'ca5@test.com' });
    const group = await createTestGroup(admin._id, { name: 'ca-grp-3' });
    const tid = nextTid();

    // PENDING_ADMIN → visible
    await seedConflict({ userId: String(member._id), groupId: String(group._id), tournamentId: tid, status: 'PENDING_ADMIN' });
    // PENDING → not visible (not yet submitted to admin)
    await seedConflict({ userId: String(member._id), groupId: String(group._id), tournamentId: tid, status: 'PENDING' });
    // APPROVED → not visible
    await seedConflict({ userId: String(member._id), groupId: String(group._id), tournamentId: tid, status: 'APPROVED' });

    const cookie = await createAuthCookie(admin._id, 'USER');
    const req = makeRequest('GET', `/api/groups/${group._id}/conflicts`, undefined, cookie);
    const res = await getGroupConflicts(req, groupConflictParams(String(group._id)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.conflicts).toHaveLength(1);
    expect(data.conflicts[0].status).toBe('PENDING_ADMIN');
  });

  it('inclut le username du membre dans la réponse (populate)', async () => {
    const admin = await createTestUser({ username: 'ca6', email: 'ca6@test.com' });
    const member = await createTestUser({ username: 'memberuser', email: 'ca7@test.com' });
    const group = await createTestGroup(admin._id, { name: 'ca-grp-4' });
    const tid = nextTid();

    await seedConflict({ userId: String(member._id), groupId: String(group._id), tournamentId: tid });

    const cookie = await createAuthCookie(admin._id, 'USER');
    const req = makeRequest('GET', `/api/groups/${group._id}/conflicts`, undefined, cookie);
    const res = await getGroupConflicts(req, groupConflictParams(String(group._id)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.conflicts[0].userId.username).toBe('memberuser');
  });
});

// ─── PATCH /api/groups/[id]/conflicts/[conflictId] ────────────────────────

describe('PATCH /api/groups/[id]/conflicts/[conflictId]', () => {
  it('retourne 401 sans session', async () => {
    const req = makeRequest('PATCH', '/api/groups/g1/conflicts/fakeid', { decision: 'APPROVED' });
    const res = await patchGroupConflict(req, conflictParams('g1', 'fakeid'));
    expect(res.status).toBe(401);
  });

  it('retourne 403 si l\'utilisateur n\'est pas admin du groupe', async () => {
    const admin = await createTestUser({ username: 'ca8', email: 'ca8@test.com' });
    const member = await createTestUser({ username: 'ca9', email: 'ca9@test.com' });
    const group = await createTestGroup(admin._id, { name: 'ca-grp-5' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: member._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: admin._id } },
    });
    const tid = nextTid();
    const conflict = await seedConflict({ userId: String(member._id), groupId: String(group._id), tournamentId: tid });

    const cookie = await createAuthCookie(member._id, 'USER');
    const req = makeRequest('PATCH', `/api/groups/${group._id}/conflicts/${conflict._id}`, { decision: 'APPROVED' }, cookie);
    const res = await patchGroupConflict(req, conflictParams(String(group._id), String(conflict._id)));
    expect(res.status).toBe(403);
  });

  it('retourne 400 pour une décision invalide', async () => {
    const admin = await createTestUser({ username: 'ca10', email: 'ca10@test.com' });
    const member = await createTestUser({ username: 'ca11', email: 'ca11@test.com' });
    const group = await createTestGroup(admin._id, { name: 'ca-grp-6' });
    const tid = nextTid();
    const conflict = await seedConflict({ userId: String(member._id), groupId: String(group._id), tournamentId: tid });

    const cookie = await createAuthCookie(admin._id, 'USER');
    const req = makeRequest('PATCH', `/api/groups/${group._id}/conflicts/${conflict._id}`, { decision: 'MAYBE' }, cookie);
    const res = await patchGroupConflict(req, conflictParams(String(group._id), String(conflict._id)));
    expect(res.status).toBe(400);
  });

  it('retourne 404 si le conflit n\'existe pas', async () => {
    const admin = await createTestUser({ username: 'ca12', email: 'ca12@test.com' });
    const group = await createTestGroup(admin._id, { name: 'ca-grp-7' });
    const fakeId = '000000000000000000000001';

    const cookie = await createAuthCookie(admin._id, 'USER');
    const req = makeRequest('PATCH', `/api/groups/${group._id}/conflicts/${fakeId}`, { decision: 'APPROVED' }, cookie);
    const res = await patchGroupConflict(req, conflictParams(String(group._id), fakeId));
    expect(res.status).toBe(404);
  });

  it('APPROVED met à jour les encres du groupe et passe le conflit en APPROVED', async () => {
    const admin = await createTestUser({ username: 'ca13', email: 'ca13@test.com' });
    const member = await createTestUser({ username: 'ca14', email: 'ca14@test.com' });
    const group = await createTestGroup(admin._id, { name: 'ca-grp-8' });
    const tid = nextTid();

    await TournamentPlayersDeckModel.create({
      tournamentId: tid, groupId: group._id, userId: null,
      players: [{ playerId: 1, best_identifier: 'Player One', game_user_profile_picture_url: '', pronouns: null, decks: [['Amber', 'Sapphire']] }],
    });

    const conflict = await seedConflict({
      userId: String(member._id), groupId: String(group._id), tournamentId: tid,
      previousInks: [['Amber', 'Sapphire']], proposedInks: [['Steel', 'Ruby']],
    });

    const cookie = await createAuthCookie(admin._id, 'USER');
    const req = makeRequest('PATCH', `/api/groups/${group._id}/conflicts/${conflict._id}`, { decision: 'APPROVED' }, cookie);
    const res = await patchGroupConflict(req, conflictParams(String(group._id), String(conflict._id)));
    expect(res.status).toBe(200);

    const updated = await TournamentConflictModel.findById(conflict._id);
    expect(updated!.status).toBe('APPROVED');
    const groupDeck = await TournamentPlayersDeckModel.findOne({ tournamentId: tid, groupId: group._id, userId: null });
    expect(groupDeck!.players[0].decks).toEqual([['Steel', 'Ruby']]);
  });

  it('REJECTED conserve les encres du groupe et passe le conflit en REJECTED', async () => {
    const admin = await createTestUser({ username: 'ca15', email: 'ca15@test.com' });
    const member = await createTestUser({ username: 'ca16', email: 'ca16@test.com' });
    const group = await createTestGroup(admin._id, { name: 'ca-grp-9' });
    const tid = nextTid();

    await TournamentPlayersDeckModel.create({
      tournamentId: tid, groupId: group._id, userId: null,
      players: [{ playerId: 1, best_identifier: 'Player One', game_user_profile_picture_url: '', pronouns: null, decks: [['Amber', 'Sapphire']] }],
    });

    const conflict = await seedConflict({
      userId: String(member._id), groupId: String(group._id), tournamentId: tid,
      previousInks: [['Amber', 'Sapphire']], proposedInks: [['Steel', 'Ruby']],
    });

    const cookie = await createAuthCookie(admin._id, 'USER');
    const req = makeRequest('PATCH', `/api/groups/${group._id}/conflicts/${conflict._id}`, { decision: 'REJECTED' }, cookie);
    const res = await patchGroupConflict(req, conflictParams(String(group._id), String(conflict._id)));
    expect(res.status).toBe(200);

    const updated = await TournamentConflictModel.findById(conflict._id);
    expect(updated!.status).toBe('REJECTED');
    const groupDeck = await TournamentPlayersDeckModel.findOne({ tournamentId: tid, groupId: group._id, userId: null });
    expect(groupDeck!.players[0].decks).toEqual([['Amber', 'Sapphire']]);
  });

  it('retourne 400 si le conflit n\'est plus en statut PENDING_ADMIN', async () => {
    const admin = await createTestUser({ username: 'ca17', email: 'ca17@test.com' });
    const member = await createTestUser({ username: 'ca18', email: 'ca18@test.com' });
    const group = await createTestGroup(admin._id, { name: 'ca-grp-10' });
    const tid = nextTid();
    const conflict = await seedConflict({
      userId: String(member._id), groupId: String(group._id), tournamentId: tid, status: 'APPROVED',
    });

    const cookie = await createAuthCookie(admin._id, 'USER');
    const req = makeRequest('PATCH', `/api/groups/${group._id}/conflicts/${conflict._id}`, { decision: 'APPROVED' }, cookie);
    const res = await patchGroupConflict(req, conflictParams(String(group._id), String(conflict._id)));
    expect(res.status).toBe(400);
  });
});
