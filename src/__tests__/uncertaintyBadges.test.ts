import { describe, it, expect } from 'vitest';
import { GET as getUncertainties } from '../../app/api/groups/[id]/uncertainties/route';
import { DELETE as dismissUncertainty } from '../../app/api/groups/[id]/uncertainties/[conflictId]/route';
import TournamentConflictModel from '@models/TournamentConflict';
import GroupModel from '@models/Group';
import { createTestUser, createAuthCookie, createTestGroup, makeRequest } from '../test/helpers';

let _counter = 0;
function nextTid() { return 500000 + ++_counter; }

function groupParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function conflictParams(id: string, conflictId: string) {
  return { params: Promise.resolve({ id, conflictId }) };
}

async function seedConflict(opts: {
  userId: string;
  groupId: string;
  tournamentId: number;
  status: string;
}) {
  return TournamentConflictModel.create({
    userId: opts.userId,
    groupId: opts.groupId,
    tournamentId: opts.tournamentId,
    playerId: 1,
    playerName: 'Player One',
    previousInks: [['Amber', 'Sapphire']],
    proposedInks: [['Steel', 'Ruby']],
    status: opts.status,
  });
}

describe('GET /api/groups/[id]/uncertainties', () => {
  it('retourne 401 sans session', async () => {
    const req = makeRequest('GET', '/api/groups/g1/uncertainties');
    const res = await getUncertainties(req, groupParams('g1'));
    expect(res.status).toBe(401);
  });

  it('retourne 403 si l\'utilisateur n\'est pas membre du groupe', async () => {
    const admin = await createTestUser({ username: 'ub1', email: 'ub1@test.com' });
    const outsider = await createTestUser({ username: 'ub2', email: 'ub2@test.com' });
    const group = await createTestGroup(admin._id, { name: 'ub-grp-1' });

    const cookie = await createAuthCookie(outsider._id, 'USER');
    const req = makeRequest('GET', `/api/groups/${group._id}/uncertainties`, undefined, cookie);
    const res = await getUncertainties(req, groupParams(String(group._id)));
    expect(res.status).toBe(403);
  });

  it('retourne 200 avec liste vide si aucune incertitude', async () => {
    const admin = await createTestUser({ username: 'ub3', email: 'ub3@test.com' });
    const group = await createTestGroup(admin._id, { name: 'ub-grp-2' });
    const cookie = await createAuthCookie(admin._id, 'USER');
    const req = makeRequest('GET', `/api/groups/${group._id}/uncertainties`, undefined, cookie);
    const res = await getUncertainties(req, groupParams(String(group._id)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.uncertainties).toEqual([]);
  });

  it('retourne uniquement les conflits UNCERTAINTY du groupe', async () => {
    const admin = await createTestUser({ username: 'ub4', email: 'ub4@test.com' });
    const member = await createTestUser({ username: 'ub5', email: 'ub5@test.com' });
    const group = await createTestGroup(admin._id, { name: 'ub-grp-3' });
    const tid = nextTid();

    // UNCERTAINTY → visible
    await seedConflict({ userId: String(member._id), groupId: String(group._id), tournamentId: tid, status: 'UNCERTAINTY' });
    // PENDING → not visible
    await seedConflict({ userId: String(member._id), groupId: String(group._id), tournamentId: tid, status: 'PENDING' });
    // PENDING_ADMIN → not visible
    await seedConflict({ userId: String(member._id), groupId: String(group._id), tournamentId: tid, status: 'PENDING_ADMIN' });

    const cookie = await createAuthCookie(admin._id, 'USER');
    const req = makeRequest('GET', `/api/groups/${group._id}/uncertainties`, undefined, cookie);
    const res = await getUncertainties(req, groupParams(String(group._id)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.uncertainties).toHaveLength(1);
    expect(data.uncertainties[0].status).toBe('UNCERTAINTY');
  });

  it('est accessible par un membre non-admin', async () => {
    const admin = await createTestUser({ username: 'ub6', email: 'ub6@test.com' });
    const member = await createTestUser({ username: 'ub7', email: 'ub7@test.com' });
    const group = await createTestGroup(admin._id, { name: 'ub-grp-4' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: member._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: admin._id } },
    });
    const tid = nextTid();
    await seedConflict({ userId: String(admin._id), groupId: String(group._id), tournamentId: tid, status: 'UNCERTAINTY' });

    const cookie = await createAuthCookie(member._id, 'USER');
    const req = makeRequest('GET', `/api/groups/${group._id}/uncertainties`, undefined, cookie);
    const res = await getUncertainties(req, groupParams(String(group._id)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.uncertainties).toHaveLength(1);
  });

  it('retourne les incertitudes de plusieurs tournois en une seule requête', async () => {
    const admin = await createTestUser({ username: 'ub8', email: 'ub8@test.com' });
    const member = await createTestUser({ username: 'ub9', email: 'ub9@test.com' });
    const group = await createTestGroup(admin._id, { name: 'ub-grp-5' });
    const tid1 = nextTid();
    const tid2 = nextTid();

    await seedConflict({ userId: String(member._id), groupId: String(group._id), tournamentId: tid1, status: 'UNCERTAINTY' });
    await seedConflict({ userId: String(member._id), groupId: String(group._id), tournamentId: tid1, status: 'UNCERTAINTY' });
    await seedConflict({ userId: String(member._id), groupId: String(group._id), tournamentId: tid2, status: 'UNCERTAINTY' });

    const cookie = await createAuthCookie(admin._id, 'USER');
    const req = makeRequest('GET', `/api/groups/${group._id}/uncertainties`, undefined, cookie);
    const res = await getUncertainties(req, groupParams(String(group._id)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.uncertainties).toHaveLength(3);

    const byTournament = data.uncertainties.reduce((acc: Record<number, number>, c: { tournamentId: number }) => {
      acc[c.tournamentId] = (acc[c.tournamentId] ?? 0) + 1;
      return acc;
    }, {});
    expect(byTournament[tid1]).toBe(2);
    expect(byTournament[tid2]).toBe(1);
  });
});

describe('DELETE /api/groups/[id]/uncertainties/[conflictId]', () => {
  it('retourne 401 sans session', async () => {
    const req = makeRequest('DELETE', '/api/groups/g1/uncertainties/c1');
    const res = await dismissUncertainty(req, conflictParams('g1', 'c1'));
    expect(res.status).toBe(401);
  });

  it('retourne 403 si l\'utilisateur est membre non-admin', async () => {
    const admin = await createTestUser({ username: 'ud1', email: 'ud1@test.com' });
    const member = await createTestUser({ username: 'ud2', email: 'ud2@test.com' });
    const group = await createTestGroup(admin._id, { name: 'ud-grp-1' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: member._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: admin._id } },
    });
    const conflict = await seedConflict({ userId: String(admin._id), groupId: String(group._id), tournamentId: nextTid(), status: 'UNCERTAINTY' });

    const cookie = await createAuthCookie(member._id, 'USER');
    const req = makeRequest('DELETE', `/api/groups/${group._id}/uncertainties/${conflict._id}`, undefined, cookie);
    const res = await dismissUncertainty(req, conflictParams(String(group._id), String(conflict._id)));
    expect(res.status).toBe(403);
  });

  it('supprime le conflit et retourne 200 pour un admin', async () => {
    const admin = await createTestUser({ username: 'ud3', email: 'ud3@test.com' });
    const group = await createTestGroup(admin._id, { name: 'ud-grp-2' });
    const conflict = await seedConflict({ userId: String(admin._id), groupId: String(group._id), tournamentId: nextTid(), status: 'UNCERTAINTY' });

    const cookie = await createAuthCookie(admin._id, 'USER');
    const req = makeRequest('DELETE', `/api/groups/${group._id}/uncertainties/${conflict._id}`, undefined, cookie);
    const res = await dismissUncertainty(req, conflictParams(String(group._id), String(conflict._id)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    const deleted = await TournamentConflictModel.findById(conflict._id);
    expect(deleted).toBeNull();
  });

  it('retourne 404 pour un conflictId inexistant', async () => {
    const admin = await createTestUser({ username: 'ud4', email: 'ud4@test.com' });
    const group = await createTestGroup(admin._id, { name: 'ud-grp-3' });

    const { Types } = await import('mongoose');
    const fakeId = new Types.ObjectId().toString();
    const cookie = await createAuthCookie(admin._id, 'USER');
    const req = makeRequest('DELETE', `/api/groups/${group._id}/uncertainties/${fakeId}`, undefined, cookie);
    const res = await dismissUncertainty(req, conflictParams(String(group._id), fakeId));
    expect(res.status).toBe(404);
  });

  it('retourne 400 si le conflit n\'est pas de statut UNCERTAINTY', async () => {
    const admin = await createTestUser({ username: 'ud5', email: 'ud5@test.com' });
    const group = await createTestGroup(admin._id, { name: 'ud-grp-4' });
    const conflict = await seedConflict({ userId: String(admin._id), groupId: String(group._id), tournamentId: nextTid(), status: 'PENDING' });

    const cookie = await createAuthCookie(admin._id, 'USER');
    const req = makeRequest('DELETE', `/api/groups/${group._id}/uncertainties/${conflict._id}`, undefined, cookie);
    const res = await dismissUncertainty(req, conflictParams(String(group._id), String(conflict._id)));
    expect(res.status).toBe(400);
  });
});
