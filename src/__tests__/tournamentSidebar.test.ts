import { describe, it, expect } from 'vitest';
import { GET as getMyRole } from '../../app/api/groups/[id]/my-role/route';
import { GET as getPlayers } from '../../app/api/tournaments/[id]/players/route';
import TournamentPlayersDeckModel from '@models/TournamentPlayersDeck';
import GroupModel from '@models/Group';
import { createTestUser, createAuthCookie, createTestGroup, makeRequest } from '../test/helpers';

function groupParams(id: string) {
  return { params: Promise.resolve({ id }) };
}
function tournamentParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ─── GET /api/groups/[id]/my-role ────────────────────────────────────────────

describe('GET /api/groups/[id]/my-role', () => {
  it('retourne 401 sans session', async () => {
    const req = makeRequest('GET', '/api/groups/fakeid/my-role');
    const res = await getMyRole(req, groupParams('fakeid'));
    expect(res.status).toBe(401);
  });

  it('retourne null si non-membre', async () => {
    const user = await createTestUser({ username: 'sb1', email: 'sb1@test.com' });
    const admin = await createTestUser({ username: 'sb2', email: 'sb2@test.com' });
    const group = await createTestGroup(admin._id, { name: 'sb-grp-1' });

    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', `/api/groups/${group._id}/my-role`, undefined, cookie);
    const res = await getMyRole(req, groupParams(String(group._id)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.groupRole).toBeNull();
    expect(data.appRole).toBe('USER');
  });

  it('retourne MEMBER pour un membre du groupe', async () => {
    const admin = await createTestUser({ username: 'sb3', email: 'sb3@test.com' });
    const member = await createTestUser({ username: 'sb4', email: 'sb4@test.com' });
    const group = await createTestGroup(admin._id, { name: 'sb-grp-2' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: member._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: admin._id } },
    });

    const cookie = await createAuthCookie(member._id, 'USER');
    const req = makeRequest('GET', `/api/groups/${group._id}/my-role`, undefined, cookie);
    const res = await getMyRole(req, groupParams(String(group._id)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.groupRole).toBe('MEMBER');
    expect(data.appRole).toBe('USER');
  });

  it('retourne ADMIN pour le créateur du groupe', async () => {
    const admin = await createTestUser({ username: 'sb5', email: 'sb5@test.com' });
    const group = await createTestGroup(admin._id, { name: 'sb-grp-3' });

    const cookie = await createAuthCookie(admin._id, 'USER');
    const req = makeRequest('GET', `/api/groups/${group._id}/my-role`, undefined, cookie);
    const res = await getMyRole(req, groupParams(String(group._id)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.groupRole).toBe('ADMIN');
    expect(data.appRole).toBe('USER');
  });

  it('retourne appRole ADMIN pour un ADMIN applicatif', async () => {
    const adminUser = await createTestUser({ username: 'sb6', email: 'sb6@test.com', role: 'ADMIN' });
    const group = await createTestGroup(adminUser._id, { name: 'sb-grp-4' });

    const cookie = await createAuthCookie(adminUser._id, 'ADMIN');
    const req = makeRequest('GET', `/api/groups/${group._id}/my-role`, undefined, cookie);
    const res = await getMyRole(req, groupParams(String(group._id)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.appRole).toBe('ADMIN');
  });
});

// ─── GET /api/tournaments/[id]/players ───────────────────────────────────────

describe('GET /api/tournaments/[id]/players', () => {
  it('retourne 401 sans session', async () => {
    const req = makeRequest('GET', '/api/tournaments/1/players');
    const res = await getPlayers(req, tournamentParams('1'));
    expect(res.status).toBe(401);
  });

  it('retourne 403 si non-membre du groupe demandé', async () => {
    const user = await createTestUser({ username: 'sb7', email: 'sb7@test.com' });
    const admin = await createTestUser({ username: 'sb8', email: 'sb8@test.com' });
    const group = await createTestGroup(admin._id, { name: 'sb-grp-5' });

    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest(
      'GET',
      `/api/tournaments/1/players?groupId=${group._id}`,
      undefined,
      cookie,
    );
    const res = await getPlayers(req, tournamentParams('1'));
    expect(res.status).toBe(403);
  });

  it('retourne les joueurs du scope groupe', async () => {
    const admin = await createTestUser({ username: 'sb9', email: 'sb9@test.com' });
    const group = await createTestGroup(admin._id, { name: 'sb-grp-6' });
    const tournamentId = 500001;

    await TournamentPlayersDeckModel.create({
      tournamentId,
      groupId: group._id,
      userId: null,
      players: [
        { playerId: 1, best_identifier: 'Alice', decks: [['Amber', 'Amethyst']] },
        { playerId: 2, best_identifier: 'Bob', decks: [] },
      ],
    });

    const cookie = await createAuthCookie(admin._id, 'USER');
    const req = makeRequest(
      'GET',
      `/api/tournaments/${tournamentId}/players?groupId=${group._id}`,
      undefined,
      cookie,
    );
    const res = await getPlayers(req, tournamentParams(String(tournamentId)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.players).toHaveLength(2);
    expect(data.players.find((p: { playerId: number }) => p.playerId === 1).best_identifier).toBe('Alice');
  });

  it('retourne les joueurs du scope personnel si pas de groupId', async () => {
    const user = await createTestUser({ username: 'sb10', email: 'sb10@test.com' });
    const tournamentId = 500002;

    await TournamentPlayersDeckModel.create({
      tournamentId,
      groupId: null,
      userId: user._id,
      players: [{ playerId: 3, best_identifier: 'Charlie', decks: [['Emerald', 'Ruby']] }],
    });

    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', `/api/tournaments/${tournamentId}/players`, undefined, cookie);
    const res = await getPlayers(req, tournamentParams(String(tournamentId)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.players).toHaveLength(1);
    expect(data.players[0].best_identifier).toBe('Charlie');
  });

  it('retourne une liste vide si aucun joueur connu', async () => {
    const user = await createTestUser({ username: 'sb11', email: 'sb11@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', '/api/tournaments/999999/players', undefined, cookie);
    const res = await getPlayers(req, tournamentParams('999999'));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.players).toEqual([]);
  });
});
