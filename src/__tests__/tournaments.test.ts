import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as listTournaments, POST as upsertTournament } from '../../app/api/tournaments/route';
import { GET as getTournament, DELETE as deleteTournament } from '../../app/api/tournaments/[id]/route';
import { POST as fetchTournament } from '../../app/api/admin/fetchTournament/route';
import { DELETE as adminDeleteTournament } from '../../app/api/admin/tournaments/route';
import TournamentModel from '@models/Tournament';
import RoundModel from '@models/Round';
import { makeRequest } from '../test/helpers';
import { NextRequest } from 'next/server';

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
    const req = new NextRequest('http://localhost:3000/api/tournaments');
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
  it('retourne 404 pour un id inconnu', async () => {
    const req = makeRequest('DELETE', '/api/tournaments/999');
    const res = await deleteTournament(req, params('999'));
    expect(res.status).toBe(404);
  });

  it('supprime le tournoi et retourne 200', async () => {
    const t = await seedTournament();
    const req = makeRequest('DELETE', `/api/tournaments/${t.id}`);
    const res = await deleteTournament(req, params(String(t.id)));
    expect(res.status).toBe(200);
    const gone = await TournamentModel.findOne({ id: t.id });
    expect(gone).toBeNull();
  });
});

describe('POST /api/admin/fetchTournament', () => {
  it('retourne 400 sans tournamentId', async () => {
    const req = makeRequest('POST', '/api/admin/fetchTournament', {});
    const res = await fetchTournament(req);
    expect(res.status).toBe(400);
  });

  it('fetche et sauvegarde un tournoi via RavensburgerClient', async () => {
    const tid = nextId();
    vi.mocked(RavensburgerClient.fetchTournament).mockResolvedValue({
      id: tid,
      name: 'Mocked Tournament',
      event_status: 'ENDED',
      start_datetime: new Date().toISOString(),
      tournament_phases: [],
    } as never);

    const req = makeRequest('POST', '/api/admin/fetchTournament', { tournamentId: tid, isRefetch: false });
    const res = await fetchTournament(req);
    expect(res.status).toBe(200);
    const saved = await TournamentModel.findOne({ id: tid });
    expect(saved).not.toBeNull();
    expect(saved!.name).toBe('Mocked Tournament');
  });

  it('retourne 500 si l\'id retourné par l\'API ne correspond pas', async () => {
    const tid = nextId();
    vi.mocked(RavensburgerClient.fetchTournament).mockResolvedValue({ id: 9999 } as never);
    const req = makeRequest('POST', '/api/admin/fetchTournament', { tournamentId: tid });
    const res = await fetchTournament(req);
    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/admin/tournaments', () => {
  it('retourne 400 sans id', async () => {
    const req = makeRequest('DELETE', '/api/admin/tournaments', {});
    const res = await adminDeleteTournament(req);
    expect(res.status).toBe(400);
  });

  it('retourne 404 si le tournoi n\'existe pas', async () => {
    const req = makeRequest('DELETE', '/api/admin/tournaments', { id: 999999 });
    const res = await adminDeleteTournament(req);
    expect(res.status).toBe(404);
  });

  it('supprime le tournoi et ses rounds en cascade', async () => {
    const t = await seedTournament();
    await RoundModel.create({ id: nextId(), tournamentId: t.id, results: [makeMatch(nextId())] });
    await RoundModel.create({ id: nextId(), tournamentId: t.id, results: [makeMatch(nextId())] });

    const req = makeRequest('DELETE', '/api/admin/tournaments', { id: t.id });
    const res = await adminDeleteTournament(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.deleted.rounds).toBe(2);
    const gone = await TournamentModel.findOne({ id: t.id });
    expect(gone).toBeNull();
  });
});
