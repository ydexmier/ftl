import { describe, it, expect } from 'vitest';
import { GET as getLastRound } from '../../app/api/tournaments/[id]/last-round/route';
import RoundModel from '@models/Round';
import { createTestUser, createAuthCookie, makeRequest } from '../test/helpers';

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

let _counter = 900000;
function nextId() { return ++_counter; }

function makeMinimalMatch(id: number) {
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

async function seedRound(tournamentId: number, lastFetchedAt?: Date) {
  return RoundModel.create({
    id: nextId(),
    tournamentId,
    results: [makeMinimalMatch(nextId())],
    lastFetchedAt: lastFetchedAt ?? new Date(),
  });
}

describe('GET /api/tournaments/[id]/last-round', () => {
  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('GET', '/api/tournaments/1/last-round');
    const res = await getLastRound(req, params('1'));
    expect(res.status).toBe(401);
  });

  it('retourne 400 pour un ID non numérique', async () => {
    const user = await createTestUser({ username: 'lr1', email: 'lr1@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', '/api/tournaments/abc/last-round', undefined, cookie);
    const res = await getLastRound(req, params('abc'));
    expect(res.status).toBe(400);
  });

  it('retourne { roundId: null } pour un tournoi sans ronde fetchée', async () => {
    const user = await createTestUser({ username: 'lr2', email: 'lr2@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', '/api/tournaments/999999/last-round', undefined, cookie);
    const res = await getLastRound(req, params('999999'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.roundId).toBeNull();
  });

  it('retourne l\'ID de la ronde avec le lastFetchedAt le plus récent', async () => {
    const user = await createTestUser({ username: 'lr3', email: 'lr3@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextId();

    const older = await seedRound(tid, new Date('2026-01-01T10:00:00Z'));
    const newer = await seedRound(tid, new Date('2026-01-02T10:00:00Z'));

    const req = makeRequest('GET', `/api/tournaments/${tid}/last-round`, undefined, cookie);
    const res = await getLastRound(req, params(String(tid)));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.roundId).toBe(newer.id);
    expect(data.roundId).not.toBe(older.id);
  });

  it('ignore les rondes sans lastFetchedAt', async () => {
    const user = await createTestUser({ username: 'lr4', email: 'lr4@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextId();

    await RoundModel.create({ id: nextId(), tournamentId: tid, results: [] });

    const req = makeRequest('GET', `/api/tournaments/${tid}/last-round`, undefined, cookie);
    const res = await getLastRound(req, params(String(tid)));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.roundId).toBeNull();
  });
});
