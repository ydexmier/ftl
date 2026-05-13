import { describe, it, expect } from 'vitest';
import { GET as getUncertainties } from '../../app/api/groups/[id]/uncertainties/route';
import TournamentConflictModel from '@models/TournamentConflict';
import GroupModel from '@models/Group';
import { createTestUser, createAuthCookie, createTestGroup, makeRequest } from '../test/helpers';

let _counter = 0;
function nextTid() { return 500000 + ++_counter; }

function groupParams(id: string) {
  return { params: Promise.resolve({ id }) };
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
