import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as listTournaments } from '../../app/api/tournaments/route';
import { GET as getTournament, DELETE as deleteTournament } from '../../app/api/tournaments/[id]/route';
import { POST as fetchTournament } from '../../app/api/admin/fetchTournament/route';
import { POST as fetchTournamentUser } from '../../app/api/tournaments/fetch/route';
import { DELETE as adminDeleteTournament } from '../../app/api/admin/tournaments/route';
import TournamentModel from '@models/Tournament';
import RoundModel from '@models/Round';
import { makeRequest, createAdminUser, createTestUser, createAuthCookie } from '../test/helpers';

function makeMatch(id: number) {
  return {
    id,
    table_number: 1,
    order: 1,
    status: 'COMPLETE',
    pod_number: null,
    match_is_bye: false,
    match_is_intentional_draw: false,
    match_is_unintentional_draw: false,
    match_is_loss: false,
    reports_are_in_conflict: false,
    games_drawn: null,
    games_won_by_winner: 2,
    games_won_by_loser: 0,
    is_ghost_match: false,
    is_feature_match: false,
    deck_check_started: false,
    deck_check_completed: false,
    time_extension_seconds: 0,
    tournament_round: 1,
    winning_player: 1,
    reporting_player: null,
    assigned_judge: null,
    players: [1, 2],
    player_match_relationships: [],
  };
}

vi.mock('@/src/repositories/external/RavensburgerClient', () => ({
  RavensburgerClient: {
    fetchTournament: vi.fn(),
    fetchRound: vi.fn(),
  },
}));

import { RavensburgerClient } from '@/src/repositories/external/RavensburgerClient';

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

let _counter = 0;
function nextId() { return 800000 + ++_counter; }

async function seedTournament(id?: number) {
  const tid = id ?? nextId();
  return TournamentModel.create({
    id: tid,
    name: `Tournament ${tid}`,
    event_status: 'ENDED',
    start_datetime: new Date(),
    tournament_phases: [],
  });
}

beforeEach(() => { vi.clearAllMocks(); });

describe('GET /api/tournaments', () => {
  it('retourne 200 avec la liste des tournois', async () => {
    await seedTournament();
    await seedTournament();
    const res = await listTournaments();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(2);
  });

  it('retourne un tableau vide si aucun tournoi en base', async () => {
    const res = await listTournaments();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toEqual([]);
  });
});

describe('GET /api/tournaments/[id]', () => {
  it('retourne 404 pour un id inconnu', async () => {
    const req = makeRequest('GET', '/api/tournaments/999');
    const res = await getTournament(req, params('999'));
    expect(res.status).toBe(404);
  });

  it('retourne 200 avec le tournoi pour un id valide', async () => {
    const t = await seedTournament();
    const req = makeRequest('GET', `/api/tournaments/${t.id}`);
    const res = await getTournament(req, params(String(t.id)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.id).toBe(t.id);
    expect(data.name).toBe(t.name);
  });
});

describe('DELETE /api/tournaments/[id]', () => {
  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('DELETE', '/api/tournaments/999');
    const res = await deleteTournament(req, params('999'));
    expect(res.status).toBe(401);
  });

  it('retourne 403 si rôle USER', async () => {
    const user = await createTestUser({ username: 'del_user1', email: 'del_user1@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('DELETE', '/api/tournaments/999', undefined, cookie);
    const res = await deleteTournament(req, params('999'));
    expect(res.status).toBe(403);
  });

  it('retourne 404 pour un id inconnu avec rôle ADMIN', async () => {
    const admin = await createAdminUser({ username: 'del_admin1', email: 'del_admin1@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('DELETE', '/api/tournaments/999', undefined, cookie);
    const res = await deleteTournament(req, params('999'));
    expect(res.status).toBe(404);
  });

  it('supprime le tournoi et retourne 200 avec rôle ADMIN', async () => {
    const admin = await createAdminUser({ username: 'del_admin2', email: 'del_admin2@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const t = await seedTournament();
    const req = makeRequest('DELETE', `/api/tournaments/${t.id}`, undefined, cookie);
    const res = await deleteTournament(req, params(String(t.id)));
    expect(res.status).toBe(200);
    const gone = await TournamentModel.findOne({ id: t.id });
    expect(gone).toBeNull();
  });
});

describe('POST /api/admin/fetchTournament', () => {
  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('POST', '/api/admin/fetchTournament', { tournamentId: 1 });
    const res = await fetchTournament(req);
    expect(res.status).toBe(401);
  });

  it('retourne 403 si rôle USER', async () => {
    const user = await createTestUser({ username: 'ft_user1', email: 'ft_user1@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('POST', '/api/admin/fetchTournament', { tournamentId: 1 }, cookie);
    const res = await fetchTournament(req);
    expect(res.status).toBe(403);
  });

  it('retourne 400 sans tournamentId', async () => {
    const admin = await createAdminUser({ username: 'ft_admin1', email: 'ft_admin1@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('POST', '/api/admin/fetchTournament', {}, cookie);
    const res = await fetchTournament(req);
    expect(res.status).toBe(400);
  });

  it('fetche et sauvegarde un tournoi via RavensburgerClient', async () => {
    const admin = await createAdminUser({ username: 'ft_admin2', email: 'ft_admin2@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const tid = nextId();
    vi.mocked(RavensburgerClient.fetchTournament).mockResolvedValue({
      id: tid,
      name: 'Mocked Tournament',
      event_status: 'ENDED',
      start_datetime: new Date().toISOString(),
      tournament_phases: [],
    } as never);

    const req = makeRequest('POST', '/api/admin/fetchTournament', { tournamentId: tid }, cookie);
    const res = await fetchTournament(req);
    expect(res.status).toBe(200);
    const saved = await TournamentModel.findOne({ id: tid });
    expect(saved).not.toBeNull();
    expect(saved!.name).toBe('Mocked Tournament');
  });

  it('retourne 500 si l\'id retourné par l\'API ne correspond pas', async () => {
    const admin = await createAdminUser({ username: 'ft_admin3', email: 'ft_admin3@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const tid = nextId();
    vi.mocked(RavensburgerClient.fetchTournament).mockResolvedValue({ id: 9999 } as never);
    const req = makeRequest('POST', '/api/admin/fetchTournament', { tournamentId: tid }, cookie);
    const res = await fetchTournament(req);
    expect(res.status).toBe(500);
  });
});

describe('POST /api/tournaments/fetch', () => {
  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('POST', '/api/tournaments/fetch', { tournamentId: 1 });
    const res = await fetchTournamentUser(req);
    expect(res.status).toBe(401);
  });

  it('retourne 200 avec rôle USER', async () => {
    const user = await createTestUser({ username: 'tfu_user1', email: 'tfu_user1@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextId();
    vi.mocked(RavensburgerClient.fetchTournament).mockResolvedValue({
      id: tid,
      name: 'User Fetched Tournament',
      event_status: 'ENDED',
      start_datetime: new Date().toISOString(),
      tournament_phases: [],
    } as never);
    const req = makeRequest('POST', '/api/tournaments/fetch', { tournamentId: tid }, cookie);
    const res = await fetchTournamentUser(req);
    expect(res.status).toBe(200);
    const saved = await TournamentModel.findOne({ id: tid });
    expect(saved?.name).toBe('User Fetched Tournament');
  });

  it('retourne 200 avec rôle ADMIN', async () => {
    const admin = await createAdminUser({ username: 'tfu_admin1', email: 'tfu_admin1@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const tid = nextId();
    vi.mocked(RavensburgerClient.fetchTournament).mockResolvedValue({
      id: tid,
      name: 'Admin Fetched Tournament',
      event_status: 'ENDED',
      start_datetime: new Date().toISOString(),
      tournament_phases: [],
    } as never);
    const req = makeRequest('POST', '/api/tournaments/fetch', { tournamentId: tid }, cookie);
    const res = await fetchTournamentUser(req);
    expect(res.status).toBe(200);
  });

  it('retourne 400 sans tournamentId', async () => {
    const user = await createTestUser({ username: 'tfu_user2', email: 'tfu_user2@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('POST', '/api/tournaments/fetch', {}, cookie);
    const res = await fetchTournamentUser(req);
    expect(res.status).toBe(400);
  });

  it('retourne 429 si refetch trop rapide', async () => {
    const user = await createTestUser({ username: 'tfu_user3', email: 'tfu_user3@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextId();
    await TournamentModel.create({
      id: tid,
      name: 'T',
      event_status: 'ENDED',
      start_datetime: new Date(),
      tournament_phases: [],
      lastFetchedAt: new Date(),
    });
    const req = makeRequest('POST', '/api/tournaments/fetch', { tournamentId: tid }, cookie);
    const res = await fetchTournamentUser(req);
    expect(res.status).toBe(429);
  });

  it('retourne 500 si l\'id retourné par l\'API ne correspond pas', async () => {
    const user = await createTestUser({ username: 'tfu_user4', email: 'tfu_user4@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextId();
    vi.mocked(RavensburgerClient.fetchTournament).mockResolvedValue({ id: 9999 } as never);
    const req = makeRequest('POST', '/api/tournaments/fetch', { tournamentId: tid }, cookie);
    const res = await fetchTournamentUser(req);
    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/admin/tournaments', () => {
  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('DELETE', '/api/admin/tournaments', { id: 1 });
    const res = await adminDeleteTournament(req);
    expect(res.status).toBe(401);
  });

  it('retourne 403 si rôle USER', async () => {
    const user = await createTestUser({ username: 'dt_user1', email: 'dt_user1@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('DELETE', '/api/admin/tournaments', { id: 1 }, cookie);
    const res = await adminDeleteTournament(req);
    expect(res.status).toBe(403);
  });

  it('retourne 400 sans id', async () => {
    const admin = await createAdminUser({ username: 'dt_admin1', email: 'dt_admin1@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('DELETE', '/api/admin/tournaments', {}, cookie);
    const res = await adminDeleteTournament(req);
    expect(res.status).toBe(400);
  });

  it('retourne 404 si le tournoi n\'existe pas', async () => {
    const admin = await createAdminUser({ username: 'dt_admin2', email: 'dt_admin2@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('DELETE', '/api/admin/tournaments', { id: 999999 }, cookie);
    const res = await adminDeleteTournament(req);
    expect(res.status).toBe(404);
  });

  it('supprime le tournoi et ses rounds en cascade', async () => {
    const admin = await createAdminUser({ username: 'dt_admin3', email: 'dt_admin3@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const t = await seedTournament();
    await RoundModel.create({ id: nextId(), tournamentId: t.id, results: [makeMatch(nextId())] });
    await RoundModel.create({ id: nextId(), tournamentId: t.id, results: [makeMatch(nextId())] });

    const req = makeRequest('DELETE', '/api/admin/tournaments', { id: t.id }, cookie);
    const res = await adminDeleteTournament(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.deleted.rounds).toBe(2);
    const gone = await TournamentModel.findOne({ id: t.id });
    expect(gone).toBeNull();
  });
});
