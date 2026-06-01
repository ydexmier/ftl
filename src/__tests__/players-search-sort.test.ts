import { describe, it, expect } from 'vitest';
import { GET as getPlayers } from '../../app/api/tournaments/[id]/players/route';
import TournamentPlayersDeckModel from '@models/TournamentPlayersDeck';
import { createTestUser, createAuthCookie, makeRequest } from '../test/helpers';

let _counter = 0;
function nextId() { return 700000 + ++_counter; }

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

// Crée un document TournamentPlayersDeck en portée utilisateur
async function seedPlayers(
  tournamentId: number,
  userId: string,
  players: Array<{ playerId: number; best_identifier: string; event_best_identifier: string; decks?: string[][] }>,
) {
  return TournamentPlayersDeckModel.create({
    tournamentId,
    groupId: null,
    userId,
    players: players.map((p) => ({ ...p, pronouns: null, decks: p.decks ?? [] })),
  });
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

describe('GET /api/tournaments/[id]/players — auth', () => {
  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('GET', '/api/tournaments/1/players');
    const res = await getPlayers(req, params('1'));
    expect(res.status).toBe(401);
  });

  it('retourne 400 si tournamentId invalide', async () => {
    const user = await createTestUser({ username: 'u_auth1', email: 'u_auth1@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', '/api/tournaments/abc/players', undefined, cookie);
    const res = await getPlayers(req, params('abc'));
    expect(res.status).toBe(400);
  });
});

// ─── Recherche ────────────────────────────────────────────────────────────────

describe('GET /api/tournaments/[id]/players — recherche', () => {
  it('retourne tous les joueurs sans paramètre search', async () => {
    const user = await createTestUser({ username: 'u_search1', email: 'u_search1@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextId();

    await seedPlayers(tid, String(user._id), [
      { playerId: 1, best_identifier: 'Jean', event_best_identifier: 'DragonSlayer' },
      { playerId: 2, best_identifier: 'Marie', event_best_identifier: 'IceQueen' },
    ]);

    const req = makeRequest('GET', `/api/tournaments/${tid}/players`, undefined, cookie);
    const res = await getPlayers(req, params(String(tid)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.pagination.total).toBe(2);
  });

  it('filtre par pseudo (event_best_identifier)', async () => {
    const user = await createTestUser({ username: 'u_search2', email: 'u_search2@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextId();

    await seedPlayers(tid, String(user._id), [
      { playerId: 1, best_identifier: 'Jean', event_best_identifier: 'DragonSlayer' },
      { playerId: 2, best_identifier: 'Marie', event_best_identifier: 'IceQueen' },
      { playerId: 3, best_identifier: 'Paul', event_best_identifier: 'FireMage' },
    ]);

    const req = makeRequest('GET', `/api/tournaments/${tid}/players?search=Dragon`, undefined, cookie);
    const res = await getPlayers(req, params(String(tid)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.pagination.total).toBe(1);
    expect(data.players[0].event_best_identifier).toBe('DragonSlayer');
  });

  it('filtre par prénom (best_identifier)', async () => {
    const user = await createTestUser({ username: 'u_search3', email: 'u_search3@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextId();

    await seedPlayers(tid, String(user._id), [
      { playerId: 1, best_identifier: 'Jean', event_best_identifier: 'DragonSlayer' },
      { playerId: 2, best_identifier: 'Marie', event_best_identifier: 'IceQueen' },
    ]);

    const req = makeRequest('GET', `/api/tournaments/${tid}/players?search=Marie`, undefined, cookie);
    const res = await getPlayers(req, params(String(tid)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.pagination.total).toBe(1);
    expect(data.players[0].best_identifier).toBe('Marie');
  });

  it('la recherche est insensible à la casse', async () => {
    const user = await createTestUser({ username: 'u_search4', email: 'u_search4@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextId();

    await seedPlayers(tid, String(user._id), [
      { playerId: 1, best_identifier: 'Jean', event_best_identifier: 'DragonSlayer' },
      { playerId: 2, best_identifier: 'Marie', event_best_identifier: 'IceQueen' },
    ]);

    const req = makeRequest('GET', `/api/tournaments/${tid}/players?search=dragon`, undefined, cookie);
    const res = await getPlayers(req, params(String(tid)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.pagination.total).toBe(1);
    expect(data.players[0].event_best_identifier).toBe('DragonSlayer');
  });

  it('retourne 0 résultats si aucun joueur ne correspond', async () => {
    const user = await createTestUser({ username: 'u_search5', email: 'u_search5@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextId();

    await seedPlayers(tid, String(user._id), [
      { playerId: 1, best_identifier: 'Jean', event_best_identifier: 'DragonSlayer' },
    ]);

    const req = makeRequest('GET', `/api/tournaments/${tid}/players?search=XxX_nobody_XxX`, undefined, cookie);
    const res = await getPlayers(req, params(String(tid)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.pagination.total).toBe(0);
    expect(data.players).toHaveLength(0);
  });

  it('retrouve un joueur correspondant sur le pseudo même si le prénom ne correspond pas', async () => {
    const user = await createTestUser({ username: 'u_search6', email: 'u_search6@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextId();

    await seedPlayers(tid, String(user._id), [
      { playerId: 1, best_identifier: 'Jean', event_best_identifier: 'Alpha' },
      { playerId: 2, best_identifier: 'AlphaBro', event_best_identifier: 'ZetaPlayer' },
    ]);

    const req = makeRequest('GET', `/api/tournaments/${tid}/players?search=Alpha`, undefined, cookie);
    const res = await getPlayers(req, params(String(tid)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.pagination.total).toBe(2);
    const pseudos = data.players.map((p: { event_best_identifier: string }) => p.event_best_identifier);
    expect(pseudos).toContain('Alpha');
    const identifiers = data.players.map((p: { best_identifier: string }) => p.best_identifier);
    expect(identifiers).toContain('AlphaBro');
  });
});

// ─── Tri ──────────────────────────────────────────────────────────────────────

describe('GET /api/tournaments/[id]/players — tri', () => {
  it('trie par pseudo (event_best_identifier) en ordre croissant par défaut', async () => {
    const user = await createTestUser({ username: 'u_sort1', email: 'u_sort1@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextId();

    await seedPlayers(tid, String(user._id), [
      { playerId: 1, best_identifier: 'Jean', event_best_identifier: 'Zeta' },
      { playerId: 2, best_identifier: 'Marie', event_best_identifier: 'Alpha' },
      { playerId: 3, best_identifier: 'Paul', event_best_identifier: 'Gamma' },
    ]);

    const req = makeRequest('GET', `/api/tournaments/${tid}/players`, undefined, cookie);
    const res = await getPlayers(req, params(String(tid)));
    const data = await res.json();

    expect(res.status).toBe(200);
    const pseudos = data.players.map((p: { event_best_identifier: string }) => p.event_best_identifier);
    expect(pseudos).toEqual(['Alpha', 'Gamma', 'Zeta']);
  });

  it('trie par pseudo en ordre décroissant avec sort=desc', async () => {
    const user = await createTestUser({ username: 'u_sort2', email: 'u_sort2@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextId();

    await seedPlayers(tid, String(user._id), [
      { playerId: 1, best_identifier: 'Jean', event_best_identifier: 'Zeta' },
      { playerId: 2, best_identifier: 'Marie', event_best_identifier: 'Alpha' },
      { playerId: 3, best_identifier: 'Paul', event_best_identifier: 'Gamma' },
    ]);

    const req = makeRequest('GET', `/api/tournaments/${tid}/players?sort=desc`, undefined, cookie);
    const res = await getPlayers(req, params(String(tid)));
    const data = await res.json();

    expect(res.status).toBe(200);
    const pseudos = data.players.map((p: { event_best_identifier: string }) => p.event_best_identifier);
    expect(pseudos).toEqual(['Zeta', 'Gamma', 'Alpha']);
  });

  it('sort=asc est identique au comportement par défaut', async () => {
    const user = await createTestUser({ username: 'u_sort3', email: 'u_sort3@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextId();

    await seedPlayers(tid, String(user._id), [
      { playerId: 1, best_identifier: 'Jean', event_best_identifier: 'Zeta' },
      { playerId: 2, best_identifier: 'Marie', event_best_identifier: 'Alpha' },
    ]);

    const req = makeRequest('GET', `/api/tournaments/${tid}/players?sort=asc`, undefined, cookie);
    const res = await getPlayers(req, params(String(tid)));
    const data = await res.json();

    expect(res.status).toBe(200);
    const pseudos = data.players.map((p: { event_best_identifier: string }) => p.event_best_identifier);
    expect(pseudos).toEqual(['Alpha', 'Zeta']);
  });

  it("le tri ne change pas les résultats d'une recherche, seulement l'ordre", async () => {
    const user = await createTestUser({ username: 'u_sort4', email: 'u_sort4@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextId();

    await seedPlayers(tid, String(user._id), [
      { playerId: 1, best_identifier: 'Jean', event_best_identifier: 'ZetaMage' },
      { playerId: 2, best_identifier: 'Marie', event_best_identifier: 'AlphaMage' },
      { playerId: 3, best_identifier: 'Paul', event_best_identifier: 'BetaWarrior' },
    ]);

    const ascReq = makeRequest('GET', `/api/tournaments/${tid}/players?search=Mage&sort=asc`, undefined, cookie);
    const descReq = makeRequest('GET', `/api/tournaments/${tid}/players?search=Mage&sort=desc`, undefined, cookie);

    const [ascRes, descRes] = await Promise.all([
      getPlayers(ascReq, params(String(tid))),
      getPlayers(descReq, params(String(tid))),
    ]);

    const ascData = await ascRes.json();
    const descData = await descRes.json();

    expect(ascData.pagination.total).toBe(2);
    expect(descData.pagination.total).toBe(2);
    expect(ascData.players.map((p: { event_best_identifier: string }) => p.event_best_identifier)).toEqual(['AlphaMage', 'ZetaMage']);
    expect(descData.players.map((p: { event_best_identifier: string }) => p.event_best_identifier)).toEqual(['ZetaMage', 'AlphaMage']);
  });
});

// ─── Pagination ───────────────────────────────────────────────────────────────

describe('GET /api/tournaments/[id]/players — pagination', () => {
  it('respecte perPage', async () => {
    const user = await createTestUser({ username: 'u_pag1', email: 'u_pag1@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextId();

    await seedPlayers(tid, String(user._id), [
      { playerId: 1, best_identifier: 'A', event_best_identifier: 'Alpha' },
      { playerId: 2, best_identifier: 'B', event_best_identifier: 'Beta' },
      { playerId: 3, best_identifier: 'C', event_best_identifier: 'Gamma' },
    ]);

    const req = makeRequest('GET', `/api/tournaments/${tid}/players?perPage=2&page=1`, undefined, cookie);
    const res = await getPlayers(req, params(String(tid)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.players).toHaveLength(2);
    expect(data.pagination.total).toBe(3);
    expect(data.pagination.totalPages).toBe(2);
  });

  it('retourne la page 2 correctement', async () => {
    const user = await createTestUser({ username: 'u_pag2', email: 'u_pag2@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextId();

    await seedPlayers(tid, String(user._id), [
      { playerId: 1, best_identifier: 'A', event_best_identifier: 'Alpha' },
      { playerId: 2, best_identifier: 'B', event_best_identifier: 'Beta' },
      { playerId: 3, best_identifier: 'C', event_best_identifier: 'Gamma' },
    ]);

    const req = makeRequest('GET', `/api/tournaments/${tid}/players?perPage=2&page=2`, undefined, cookie);
    const res = await getPlayers(req, params(String(tid)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.players).toHaveLength(1);
    expect(data.players[0].event_best_identifier).toBe('Gamma');
  });
});
