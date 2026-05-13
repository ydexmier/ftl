import { describe, it, expect } from 'vitest';
import { GET as getConflicts } from '../../app/api/tournaments/[id]/conflicts/route';
import { PATCH as patchConflict } from '../../app/api/tournaments/[id]/conflicts/[conflictId]/route';
import TournamentConflictModel from '@models/TournamentConflict';
import TournamentPlayersDeckModel from '@models/TournamentPlayersDeck';
import { createTestUser, createAuthCookie, createTestGroup, makeRequest } from '../test/helpers';

let _counter = 0;
function nextTid() { return 700000 + ++_counter; }

function conflictParams(id: string, conflictId: string) {
  return { params: Promise.resolve({ id, conflictId }) };
}
function idParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function seedConflict(opts: {
  userId: string;
  groupId: string;
  tournamentId: number;
  status?: string;
}) {
  return TournamentConflictModel.create({
    userId: opts.userId,
    groupId: opts.groupId,
    tournamentId: opts.tournamentId,
    playerId: 1,
    playerName: 'Player One',
    previousInks: [['Amber', 'Sapphire']],
    proposedInks: [['Steel', 'Ruby']],
    status: opts.status ?? 'PENDING',
  });
}

// ─── GET /api/tournaments/[id]/conflicts ──────────────────────────────────

describe('GET /api/tournaments/[id]/conflicts', () => {
  it('retourne 401 sans session', async () => {
    const req = makeRequest('GET', '/api/tournaments/1/conflicts');
    const res = await getConflicts(req, idParams('1'));
    expect(res.status).toBe(401);
  });

  it('retourne 400 si l\'id n\'est pas un nombre', async () => {
    const user = await createTestUser({ username: 'cf1', email: 'cf1@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', '/api/tournaments/invalid/conflicts', undefined, cookie);
    const res = await getConflicts(req, idParams('invalid'));
    expect(res.status).toBe(400);
  });

  it('retourne 200 avec une liste vide si aucun conflit', async () => {
    const user = await createTestUser({ username: 'cf2', email: 'cf2@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextTid();
    const req = makeRequest('GET', `/api/tournaments/${tid}/conflicts`, undefined, cookie);
    const res = await getConflicts(req, idParams(String(tid)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.conflicts).toEqual([]);
  });

  it('retourne uniquement les conflits PENDING de l\'utilisateur connecté', async () => {
    const user = await createTestUser({ username: 'cf3', email: 'cf3@test.com' });
    const other = await createTestUser({ username: 'cf4', email: 'cf4@test.com' });
    const group = await createTestGroup(user._id, { name: 'cf-grp-1' });
    const tid = nextTid();

    // user PENDING → visible
    await seedConflict({ userId: String(user._id), groupId: String(group._id), tournamentId: tid });
    // user PENDING_ADMIN → not visible (already submitted)
    await seedConflict({ userId: String(user._id), groupId: String(group._id), tournamentId: tid, status: 'PENDING_ADMIN' });
    // other user PENDING → not visible (belongs to other user)
    await seedConflict({ userId: String(other._id), groupId: String(group._id), tournamentId: tid });

    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', `/api/tournaments/${tid}/conflicts`, undefined, cookie);
    const res = await getConflicts(req, idParams(String(tid)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.conflicts).toHaveLength(1);
    expect(data.conflicts[0].status).toBe('PENDING');
  });

  it('inclut le nom du groupe dans la réponse (populate)', async () => {
    const user = await createTestUser({ username: 'cf5', email: 'cf5@test.com' });
    const group = await createTestGroup(user._id, { name: 'Mon Groupe Test' });
    const tid = nextTid();

    await seedConflict({ userId: String(user._id), groupId: String(group._id), tournamentId: tid });

    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', `/api/tournaments/${tid}/conflicts`, undefined, cookie);
    const res = await getConflicts(req, idParams(String(tid)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.conflicts[0].groupId.name).toBe('Mon Groupe Test');
  });
});

// ─── PATCH /api/tournaments/[id]/conflicts/[conflictId] ───────────────────

describe('PATCH /api/tournaments/[id]/conflicts/[conflictId]', () => {
  it('retourne 401 sans session', async () => {
    const req = makeRequest('PATCH', '/api/tournaments/1/conflicts/fakeid', { status: 'PENDING_ADMIN' });
    const res = await patchConflict(req, conflictParams('1', 'fakeid'));
    expect(res.status).toBe(401);
  });

  it('retourne 400 pour un statut invalide', async () => {
    const user = await createTestUser({ username: 'cf6', email: 'cf6@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const group = await createTestGroup(user._id, { name: 'cf-grp-2' });
    const tid = nextTid();
    const conflict = await seedConflict({ userId: String(user._id), groupId: String(group._id), tournamentId: tid });

    const req = makeRequest('PATCH', `/api/tournaments/${tid}/conflicts/${conflict._id}`, { status: 'APPROVED' }, cookie);
    const res = await patchConflict(req, conflictParams(String(tid), String(conflict._id)));
    expect(res.status).toBe(400);
  });

  it('retourne 404 si le conflit n\'existe pas', async () => {
    const user = await createTestUser({ username: 'cf7', email: 'cf7@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const fakeId = '000000000000000000000001';

    const req = makeRequest('PATCH', `/api/tournaments/1/conflicts/${fakeId}`, { status: 'PENDING_ADMIN' }, cookie);
    const res = await patchConflict(req, conflictParams('1', fakeId));
    expect(res.status).toBe(404);
  });

  it('retourne 403 si l\'utilisateur n\'est pas le propriétaire du conflit', async () => {
    const owner = await createTestUser({ username: 'cf8', email: 'cf8@test.com' });
    const other = await createTestUser({ username: 'cf9', email: 'cf9@test.com' });
    const group = await createTestGroup(owner._id, { name: 'cf-grp-3' });
    const tid = nextTid();
    const conflict = await seedConflict({ userId: String(owner._id), groupId: String(group._id), tournamentId: tid });

    const cookie = await createAuthCookie(other._id, 'USER');
    const req = makeRequest('PATCH', `/api/tournaments/${tid}/conflicts/${conflict._id}`, { status: 'PENDING_ADMIN' }, cookie);
    const res = await patchConflict(req, conflictParams(String(tid), String(conflict._id)));
    expect(res.status).toBe(403);
  });

  it('retourne 400 si le conflit n\'est plus en statut PENDING', async () => {
    const user = await createTestUser({ username: 'cf10', email: 'cf10@test.com' });
    const group = await createTestGroup(user._id, { name: 'cf-grp-4' });
    const tid = nextTid();
    const conflict = await seedConflict({
      userId: String(user._id), groupId: String(group._id), tournamentId: tid, status: 'PENDING_ADMIN',
    });

    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('PATCH', `/api/tournaments/${tid}/conflicts/${conflict._id}`, { status: 'PENDING_ADMIN' }, cookie);
    const res = await patchConflict(req, conflictParams(String(tid), String(conflict._id)));
    expect(res.status).toBe(400);
  });

  it('passe le conflit en PENDING_ADMIN', async () => {
    const user = await createTestUser({ username: 'cf11', email: 'cf11@test.com' });
    const group = await createTestGroup(user._id, { name: 'cf-grp-5' });
    const tid = nextTid();
    const conflict = await seedConflict({ userId: String(user._id), groupId: String(group._id), tournamentId: tid });

    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('PATCH', `/api/tournaments/${tid}/conflicts/${conflict._id}`, { status: 'PENDING_ADMIN' }, cookie);
    const res = await patchConflict(req, conflictParams(String(tid), String(conflict._id)));
    expect(res.status).toBe(200);
    const updated = await TournamentConflictModel.findById(conflict._id);
    expect(updated!.status).toBe('PENDING_ADMIN');
  });

  it('passe le conflit en UNCERTAINTY', async () => {
    const user = await createTestUser({ username: 'cf12', email: 'cf12@test.com' });
    const group = await createTestGroup(user._id, { name: 'cf-grp-6' });
    const tid = nextTid();
    const conflict = await seedConflict({ userId: String(user._id), groupId: String(group._id), tournamentId: tid });

    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('PATCH', `/api/tournaments/${tid}/conflicts/${conflict._id}`, { status: 'UNCERTAINTY' }, cookie);
    const res = await patchConflict(req, conflictParams(String(tid), String(conflict._id)));
    expect(res.status).toBe(200);
    const updated = await TournamentConflictModel.findById(conflict._id);
    expect(updated!.status).toBe('UNCERTAINTY');
  });
});

// ─── ConflictService.resolveAdminConflict ─────────────────────────────────

describe('ConflictService.resolveAdminConflict', () => {
  it('APPROVED met à jour les encres du groupe', async () => {
    const { ConflictService } = await import('@/src/services/ConflictService');
    const user = await createTestUser({ username: 'cf13', email: 'cf13@test.com' });
    const admin = await createTestUser({ username: 'cf14', email: 'cf14@test.com' });
    const group = await createTestGroup(admin._id, { name: 'cf-grp-7' });
    const tid = nextTid();

    await TournamentPlayersDeckModel.create({
      tournamentId: tid, groupId: group._id, userId: null,
      players: [{ playerId: 1, best_identifier: 'Player One', game_user_profile_picture_url: '', pronouns: null, decks: [['Amber', 'Sapphire']] }],
    });

    const conflict = await TournamentConflictModel.create({
      userId: user._id, groupId: group._id, tournamentId: tid,
      playerId: 1, playerName: 'Player One',
      previousInks: [['Amber', 'Sapphire']],
      proposedInks: [['Steel', 'Ruby']],
      status: 'PENDING_ADMIN',
    });

    await ConflictService.resolveAdminConflict(String(conflict._id), String(admin._id), 'APPROVED');

    const groupDeck = await TournamentPlayersDeckModel.findOne({ tournamentId: tid, groupId: group._id, userId: null });
    expect(groupDeck!.players[0].decks).toEqual([['Steel', 'Ruby']]);
    const updated = await TournamentConflictModel.findById(conflict._id);
    expect(updated!.status).toBe('APPROVED');
  });

  it('REJECTED ne modifie pas les encres du groupe', async () => {
    const { ConflictService } = await import('@/src/services/ConflictService');
    const user = await createTestUser({ username: 'cf15', email: 'cf15@test.com' });
    const admin = await createTestUser({ username: 'cf16', email: 'cf16@test.com' });
    const group = await createTestGroup(admin._id, { name: 'cf-grp-8' });
    const tid = nextTid();

    await TournamentPlayersDeckModel.create({
      tournamentId: tid, groupId: group._id, userId: null,
      players: [{ playerId: 1, best_identifier: 'Player One', game_user_profile_picture_url: '', pronouns: null, decks: [['Amber', 'Sapphire']] }],
    });

    const conflict = await TournamentConflictModel.create({
      userId: user._id, groupId: group._id, tournamentId: tid,
      playerId: 1, playerName: 'Player One',
      previousInks: [['Amber', 'Sapphire']],
      proposedInks: [['Steel', 'Ruby']],
      status: 'PENDING_ADMIN',
    });

    await ConflictService.resolveAdminConflict(String(conflict._id), String(admin._id), 'REJECTED');

    const groupDeck = await TournamentPlayersDeckModel.findOne({ tournamentId: tid, groupId: group._id, userId: null });
    expect(groupDeck!.players[0].decks).toEqual([['Amber', 'Sapphire']]);
    const updated = await TournamentConflictModel.findById(conflict._id);
    expect(updated!.status).toBe('REJECTED');
  });
});
