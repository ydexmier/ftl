import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getRegistrationStatus, POST as fetchRegistrations } from '../../app/api/tournaments/[id]/registrations/route';
import TournamentRegistrationModel from '@models/TournamentRegistration';
import RoundModel from '@models/Round';
import TournamentPlayersDeckModel from '@models/TournamentPlayersDeck';
import { createTestUser, createAuthCookie, makeRequest } from '../test/helpers';

vi.mock('@/src/repositories/external/RavensburgerClient', () => ({
  RavensburgerClient: {
    fetchTournament: vi.fn(),
    fetchRound: vi.fn(),
    fetchRegistrations: vi.fn(),
  },
}));

import { RavensburgerClient } from '@/src/repositories/external/RavensburgerClient';

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

let _counter = 0;
function nextTid() { return 900000 + ++_counter; }

function makeRegistrationPage(players: Array<{ id: number; userId: number; name: string; realName: string }>, total: number, page = 1) {
  return {
    page_size: 100,
    count: players.length,
    total,
    current_page_number: page,
    next_page_number: null,
    previous_page_number: null,
    results: players.map((p) => ({
      id: p.id,
      user: { id: p.userId, best_identifier: p.realName, pronouns: null },
      registration_status: 'COMPLETE',
      best_identifier: p.name,
    })),
  };
}

beforeEach(() => { vi.clearAllMocks(); });

describe('GET /api/tournaments/[id]/registrations', () => {
  it('retourne 401 sans auth', async () => {
    const req = makeRequest('GET', '/api/tournaments/1/registrations');
    const res = await getRegistrationStatus(req, params('1'));
    expect(res.status).toBe(401);
  });

  it('retourne le statut quand aucune inscription', async () => {
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextTid();

    const req = makeRequest('GET', `/api/tournaments/${tid}/registrations`, undefined, cookie);
    const res = await getRegistrationStatus(req, params(String(tid)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.tournamentStarted).toBe(false);
    expect(data.totalCount).toBe(0);
    expect(data.lastFetchedAt).toBeNull();
  });

  it('détecte le tournoi démarré quand une ronde existe', async () => {
    const user = await createTestUser({ username: 'u2', email: 'u2@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextTid();

    await RoundModel.create({ id: tid * 10, tournamentId: tid, results: [], lastFetchedAt: new Date() });

    const req = makeRequest('GET', `/api/tournaments/${tid}/registrations`, undefined, cookie);
    const res = await getRegistrationStatus(req, params(String(tid)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.tournamentStarted).toBe(true);
  });

  it('retourne lastFetchedAt quand des inscriptions existent', async () => {
    const user = await createTestUser({ username: 'u3', email: 'u3@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextTid();

    await TournamentRegistrationModel.create({
      tournamentId: tid,
      players: [{ registrationId: 1, playerId: 100, name: 'Alpha', realName: 'Alice A', registrationStatus: 'COMPLETE' }],
      totalCount: 1,
      lastFetchedAt: new Date('2026-05-22T10:00:00Z'),
    });

    const req = makeRequest('GET', `/api/tournaments/${tid}/registrations`, undefined, cookie);
    const res = await getRegistrationStatus(req, params(String(tid)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.totalCount).toBe(1);
    expect(data.lastFetchedAt).toBeTruthy();
  });
});

describe('POST /api/tournaments/[id]/registrations', () => {
  it('retourne 401 sans auth', async () => {
    const req = makeRequest('POST', '/api/tournaments/1/registrations');
    const res = await fetchRegistrations(req, params('1'));
    expect(res.status).toBe(401);
  });

  it('retourne 403 si le tournoi a déjà commencé', async () => {
    const user = await createTestUser({ username: 'u4', email: 'u4@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextTid();

    await RoundModel.create({ id: tid * 10 + 1, tournamentId: tid, results: [], lastFetchedAt: new Date() });

    const req = makeRequest('POST', `/api/tournaments/${tid}/registrations`, undefined, cookie);
    const res = await fetchRegistrations(req, params(String(tid)));
    expect(res.status).toBe(403);
  });

  it('fetche et sauvegarde les inscrits (1 page)', async () => {
    const user = await createTestUser({ username: 'u5', email: 'u5@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextTid();

    const mockPage = makeRegistrationPage(
      [
        { id: 1001, userId: 201, name: '[EC] Gege', realName: 'Gérard G' },
        { id: 1002, userId: 202, name: 'IINK_Guillaume', realName: 'Guillaume H' },
      ],
      2,
    );
    vi.mocked(RavensburgerClient.fetchRegistrations).mockResolvedValue(mockPage);

    const req = makeRequest('POST', `/api/tournaments/${tid}/registrations`, undefined, cookie);
    const res = await fetchRegistrations(req, params(String(tid)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.totalCount).toBe(2);

    const saved = await TournamentRegistrationModel.findOne({ tournamentId: tid }).lean();
    expect(saved).not.toBeNull();
    expect(saved!.players).toHaveLength(2);
    expect(saved!.players[0].name).toBe('[EC] Gege');
    expect(saved!.players[0].playerId).toBe(201);
    expect(saved!.players[0].realName).toBe('Gérard G');
  });

  it('fetche plusieurs pages en parallèle (page_size=300)', async () => {
    const user = await createTestUser({ username: 'u6', email: 'u6@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextTid();

    // 350 total → 2 pages avec page_size=300
    const page1 = makeRegistrationPage(
      Array.from({ length: 300 }, (_, i) => ({ id: 2000 + i, userId: 300 + i, name: `Player${i}`, realName: `Real${i}` })),
      350,
      1,
    );
    const page2 = makeRegistrationPage(
      Array.from({ length: 50 }, (_, i) => ({ id: 2300 + i, userId: 600 + i, name: `Player${300 + i}`, realName: `Real${300 + i}` })),
      350,
      2,
    );

    vi.mocked(RavensburgerClient.fetchRegistrations)
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2);

    const req = makeRequest('POST', `/api/tournaments/${tid}/registrations`, undefined, cookie);
    const res = await fetchRegistrations(req, params(String(tid)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.totalCount).toBe(350);
    expect(RavensburgerClient.fetchRegistrations).toHaveBeenCalledTimes(2);

    const saved = await TournamentRegistrationModel.findOne({ tournamentId: tid }).lean();
    expect(saved!.players).toHaveLength(350);
  });

  it('propage les joueurs dans le scope personnel de l\'appelant', async () => {
    const user = await createTestUser({ username: 'u7', email: 'u7@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextTid();

    const mockPage = makeRegistrationPage(
      [{ id: 3001, userId: 501, name: 'BetaPlayer', realName: 'Bob B' }],
      1,
    );
    vi.mocked(RavensburgerClient.fetchRegistrations).mockResolvedValue(mockPage);

    const req = makeRequest('POST', `/api/tournaments/${tid}/registrations`, undefined, cookie);
    await fetchRegistrations(req, params(String(tid)));

    const deck = await TournamentPlayersDeckModel.findOne({
      tournamentId: tid,
      userId: user._id,
      groupId: null,
    }).lean();

    expect(deck).not.toBeNull();
    expect(deck!.players).toHaveLength(1);
    expect(deck!.players[0].playerId).toBe(501);
    expect(deck!.players[0].best_identifier).toBe('Bob B');
    expect(deck!.players[0].event_best_identifier).toBe('BetaPlayer');
  });
});
