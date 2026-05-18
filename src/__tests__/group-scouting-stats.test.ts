import { describe, it, expect } from 'vitest';
import { GET as getScoutingStats } from '../../app/api/groups/[id]/tournaments/[tid]/scouting-stats/route';
import TournamentPlayersDeckModel from '@models/TournamentPlayersDeck';
import { createTestUser, createAdminUser, createAuthCookie, createTestGroup, makeRequest } from '../test/helpers';

let _tid = 700000;
function nextTid() { return ++_tid; }

function routeParams(id: string, tid: string) {
  return { params: Promise.resolve({ id, tid }) };
}

// ─── TournamentPlayersDeckRepository.getScoutingStats ────────────────────────

describe('TournamentPlayersDeckRepository.getScoutingStats', () => {
  it('retourne des zéros si aucun document pour la portée', async () => {
    const { TournamentPlayersDeckRepository } = await import('@/src/repositories/db/TournamentPlayersDeckRepository');
    const user = await createTestUser({ username: 'ss_u1', email: 'ss_u1@test.com' });
    const group = await createTestGroup(user._id, { name: 'ss-grp-1' });
    const tid = nextTid();

    const stats = await TournamentPlayersDeckRepository.getScoutingStats(tid, { groupId: String(group._id) });

    expect(stats).toEqual({ total: 0, scouted: 0, unscouted: 0, coverage: 0, deckDistribution: [] });
  });

  it('calcule total, scouted, unscouted et coverage', async () => {
    const { TournamentPlayersDeckRepository } = await import('@/src/repositories/db/TournamentPlayersDeckRepository');
    const user = await createTestUser({ username: 'ss_u2', email: 'ss_u2@test.com' });
    const group = await createTestGroup(user._id, { name: 'ss-grp-2' });
    const tid = nextTid();

    await TournamentPlayersDeckModel.create({
      tournamentId: tid,
      groupId: group._id,
      userId: null,
      players: [
        { playerId: 1, best_identifier: 'Alice', event_best_identifier: '', decks: [['Amber', 'Steel']] },
        { playerId: 2, best_identifier: 'Bob', event_best_identifier: '', decks: [['Ruby', 'Sapphire']] },
        { playerId: 3, best_identifier: 'Carol', event_best_identifier: '', decks: [] },
        { playerId: 4, best_identifier: 'Dave', event_best_identifier: '', decks: [] },
      ],
    });

    const stats = await TournamentPlayersDeckRepository.getScoutingStats(tid, { groupId: String(group._id) });

    expect(stats.total).toBe(4);
    expect(stats.scouted).toBe(2);
    expect(stats.unscouted).toBe(2);
    expect(stats.coverage).toBe(50);
  });

  it('coverage est 100 quand tous les joueurs sont scoutés', async () => {
    const { TournamentPlayersDeckRepository } = await import('@/src/repositories/db/TournamentPlayersDeckRepository');
    const user = await createTestUser({ username: 'ss_u3', email: 'ss_u3@test.com' });
    const group = await createTestGroup(user._id, { name: 'ss-grp-3' });
    const tid = nextTid();

    await TournamentPlayersDeckModel.create({
      tournamentId: tid,
      groupId: group._id,
      userId: null,
      players: [
        { playerId: 1, best_identifier: 'Alice', event_best_identifier: '', decks: [['Amber', 'Steel']] },
        { playerId: 2, best_identifier: 'Bob', event_best_identifier: '', decks: [['Ruby', 'Sapphire']] },
      ],
    });

    const stats = await TournamentPlayersDeckRepository.getScoutingStats(tid, { groupId: String(group._id) });

    expect(stats.coverage).toBe(100);
    expect(stats.unscouted).toBe(0);
  });

  it('construit la distribution des decks triée par count décroissant', async () => {
    const { TournamentPlayersDeckRepository } = await import('@/src/repositories/db/TournamentPlayersDeckRepository');
    const user = await createTestUser({ username: 'ss_u4', email: 'ss_u4@test.com' });
    const group = await createTestGroup(user._id, { name: 'ss-grp-4' });
    const tid = nextTid();

    await TournamentPlayersDeckModel.create({
      tournamentId: tid,
      groupId: group._id,
      userId: null,
      players: [
        { playerId: 1, best_identifier: 'P1', event_best_identifier: '', decks: [['Amber', 'Steel']] },
        { playerId: 2, best_identifier: 'P2', event_best_identifier: '', decks: [['Amber', 'Steel']] },
        { playerId: 3, best_identifier: 'P3', event_best_identifier: '', decks: [['Amber', 'Steel']] },
        { playerId: 4, best_identifier: 'P4', event_best_identifier: '', decks: [['Ruby', 'Sapphire']] },
        { playerId: 5, best_identifier: 'P5', event_best_identifier: '', decks: [['Ruby', 'Sapphire']] },
        { playerId: 6, best_identifier: 'P6', event_best_identifier: '', decks: [['Emerald', 'Amethyst']] },
      ],
    });

    const stats = await TournamentPlayersDeckRepository.getScoutingStats(tid, { groupId: String(group._id) });

    expect(stats.deckDistribution).toHaveLength(3);
    expect(stats.deckDistribution[0].count).toBe(3);
    expect(stats.deckDistribution[1].count).toBe(2);
    expect(stats.deckDistribution[2].count).toBe(1);
  });

  it('n\'inclut pas les joueurs sans deck dans la distribution', async () => {
    const { TournamentPlayersDeckRepository } = await import('@/src/repositories/db/TournamentPlayersDeckRepository');
    const user = await createTestUser({ username: 'ss_u5', email: 'ss_u5@test.com' });
    const group = await createTestGroup(user._id, { name: 'ss-grp-5' });
    const tid = nextTid();

    await TournamentPlayersDeckModel.create({
      tournamentId: tid,
      groupId: group._id,
      userId: null,
      players: [
        { playerId: 1, best_identifier: 'P1', event_best_identifier: '', decks: [['Amber', 'Steel']] },
        { playerId: 2, best_identifier: 'P2', event_best_identifier: '', decks: [] },
        { playerId: 3, best_identifier: 'P3', event_best_identifier: '', decks: [] },
      ],
    });

    const stats = await TournamentPlayersDeckRepository.getScoutingStats(tid, { groupId: String(group._id) });

    expect(stats.deckDistribution).toHaveLength(1);
    expect(stats.deckDistribution[0].count).toBe(1);
  });

  it('isole les portées : userId et groupId ne se mélangent pas', async () => {
    const { TournamentPlayersDeckRepository } = await import('@/src/repositories/db/TournamentPlayersDeckRepository');
    const user = await createTestUser({ username: 'ss_u6', email: 'ss_u6@test.com' });
    const group = await createTestGroup(user._id, { name: 'ss-grp-6' });
    const tid = nextTid();

    await TournamentPlayersDeckModel.create({
      tournamentId: tid,
      groupId: group._id,
      userId: null,
      players: [
        { playerId: 1, best_identifier: 'P1', event_best_identifier: '', decks: [['Amber', 'Steel']] },
      ],
    });
    await TournamentPlayersDeckModel.create({
      tournamentId: tid,
      groupId: null,
      userId: user._id,
      players: [
        { playerId: 1, best_identifier: 'P1', event_best_identifier: '', decks: [['Ruby', 'Sapphire']] },
        { playerId: 2, best_identifier: 'P2', event_best_identifier: '', decks: [['Emerald', 'Amethyst']] },
      ],
    });

    const groupStats = await TournamentPlayersDeckRepository.getScoutingStats(tid, { groupId: String(group._id) });
    const userStats = await TournamentPlayersDeckRepository.getScoutingStats(tid, { userId: String(user._id) });

    expect(groupStats.total).toBe(1);
    expect(userStats.total).toBe(2);
  });
});

// ─── GET /api/groups/[id]/tournaments/[tid]/scouting-stats ───────────────────

describe('GET /api/groups/[id]/tournaments/[tid]/scouting-stats', () => {
  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('GET', '/api/groups/123/tournaments/456/scouting-stats');
    const res = await getScoutingStats(req, routeParams('123', '456'));
    expect(res.status).toBe(401);
  });

  it('retourne 400 pour un tournamentId non numérique', async () => {
    const admin = await createAdminUser({ username: 'ss_a1', email: 'ss_a1@test.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('GET', '/api/groups/123/tournaments/abc/scouting-stats', undefined, cookie);
    const res = await getScoutingStats(req, routeParams('123', 'abc'));
    expect(res.status).toBe(400);
  });

  it('retourne 403 pour un utilisateur non membre du groupe', async () => {
    const owner = await createTestUser({ username: 'ss_owner1', email: 'ss_owner1@test.com' });
    const outsider = await createTestUser({ username: 'ss_out1', email: 'ss_out1@test.com' });
    const group = await createTestGroup(owner._id, { name: 'ss-api-grp-1' });
    const tid = nextTid();

    const cookie = await createAuthCookie(outsider._id, 'USER');
    const req = makeRequest('GET', `/api/groups/${group._id}/tournaments/${tid}/scouting-stats`, undefined, cookie);
    const res = await getScoutingStats(req, routeParams(String(group._id), String(tid)));
    expect(res.status).toBe(403);
  });

  it('retourne 200 avec des zéros pour un membre sans données scoutées', async () => {
    const user = await createTestUser({ username: 'ss_m1', email: 'ss_m1@test.com' });
    const group = await createTestGroup(user._id, { name: 'ss-api-grp-2' });
    const tid = nextTid();

    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', `/api/groups/${group._id}/tournaments/${tid}/scouting-stats`, undefined, cookie);
    const res = await getScoutingStats(req, routeParams(String(group._id), String(tid)));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ total: 0, scouted: 0, unscouted: 0, coverage: 0, deckDistribution: [] });
  });

  it('retourne les stats correctes pour la portée groupe', async () => {
    const user = await createTestUser({ username: 'ss_m2', email: 'ss_m2@test.com' });
    const group = await createTestGroup(user._id, { name: 'ss-api-grp-3' });
    const tid = nextTid();

    await TournamentPlayersDeckModel.create({
      tournamentId: tid,
      groupId: group._id,
      userId: null,
      players: [
        { playerId: 1, best_identifier: 'Alice', event_best_identifier: '', decks: [['Amber', 'Steel']] },
        { playerId: 2, best_identifier: 'Bob', event_best_identifier: '', decks: [['Amber', 'Steel']] },
        { playerId: 3, best_identifier: 'Carol', event_best_identifier: '', decks: [] },
      ],
    });

    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', `/api/groups/${group._id}/tournaments/${tid}/scouting-stats`, undefined, cookie);
    const res = await getScoutingStats(req, routeParams(String(group._id), String(tid)));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.total).toBe(3);
    expect(data.scouted).toBe(2);
    expect(data.unscouted).toBe(1);
    expect(data.coverage).toBe(67);
    expect(data.deckDistribution).toHaveLength(1);
    expect(data.deckDistribution[0].count).toBe(2);
  });

  it('un ADMIN accède aux stats même s\'il n\'est pas membre du groupe', async () => {
    const owner = await createTestUser({ username: 'ss_owner2', email: 'ss_owner2@test.com' });
    const admin = await createAdminUser({ username: 'ss_adm2', email: 'ss_adm2@test.com' });
    const group = await createTestGroup(owner._id, { name: 'ss-api-grp-4' });
    const tid = nextTid();

    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('GET', `/api/groups/${group._id}/tournaments/${tid}/scouting-stats`, undefined, cookie);
    const res = await getScoutingStats(req, routeParams(String(group._id), String(tid)));
    expect(res.status).toBe(200);
  });
});
