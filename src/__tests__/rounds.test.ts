import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getMatches } from '../../app/api/rounds/[roundId]/matchs/route';
import { GET as getMatch } from '../../app/api/rounds/[roundId]/matchs/[matchId]/route';
import { POST as assignDeck } from '../../app/api/rounds/[roundId]/matchs/[matchId]/assign_deck/route';
import { POST as fetchRound } from '../../app/api/admin/fetchRound/route';
import { POST as fetchRoundUser } from '../../app/api/rounds/fetch/route';
import TournamentModel from '@models/Tournament';
import RoundModel from '@models/Round';
import TournamentPlayersDeckModel from '@models/TournamentPlayersDeck';
import GroupTournamentModel from '@models/GroupTournament';
import { createTestUser, createAdminUser, createTestGroup, createAuthCookie, makeRequest } from '../test/helpers';
import { NextRequest } from 'next/server';

vi.mock('@/src/repositories/external/RavensburgerClient', () => ({
  RavensburgerClient: {
    fetchTournament: vi.fn(),
    fetchRound: vi.fn(),
  },
}));

import { RavensburgerClient } from '@/src/repositories/external/RavensburgerClient';

function roundParams(roundId: string) {
  return { params: Promise.resolve({ roundId }) };
}
function matchParams(roundId: string, matchId: string) {
  return { params: Promise.resolve({ roundId, matchId }) };
}

let _counter = 0;
function nextId() { return 700000 + ++_counter; }

function makeMatch(id: number, playerId1 = 1, playerId2 = 2) {
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
    winning_player: playerId1,
    reporting_player: null,
    assigned_judge: null,
    players: [playerId1, playerId2],
    player_match_relationships: [
      { player_order: 1, player: { id: playerId1, best_identifier: 'Alice', pronouns: null, game_user_profile_picture_url: null }, user_event_status: { id: playerId1, best_identifier: 'Alice', registration_status: 'CHECKED_IN', matches_won: 1, matches_lost: 0, matches_drawn: 0, total_match_points: 3 } },
      { player_order: 2, player: { id: playerId2, best_identifier: 'Bob', pronouns: null, game_user_profile_picture_url: null }, user_event_status: { id: playerId2, best_identifier: 'Bob', registration_status: 'CHECKED_IN', matches_won: 0, matches_lost: 1, matches_drawn: 0, total_match_points: 0 } },
    ],
  };
}

beforeEach(() => { vi.clearAllMocks(); });

describe('GET /api/rounds/[roundId]/matchs', () => {
  it('retourne 404 si le round n\'existe pas', async () => {
    const req = makeRequest('GET', '/api/rounds/999/matchs');
    const res = await getMatches(req, roundParams('999'));
    expect(res.status).toBe(404);
  });

  it('retourne 200 avec la liste paginée des matchs', async () => {
    const rid = nextId();
    const tid = nextId();
    await RoundModel.create({ id: rid, tournamentId: tid, results: [makeMatch(nextId()), makeMatch(nextId())] });
    const req = makeRequest('GET', `/api/rounds/${rid}/matchs`);
    const res = await getMatches(req, roundParams(String(rid)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.results).toHaveLength(2);
    expect(data.pagination.total).toBe(2);
  });

  it('filtre par numéro de table', async () => {
    const rid = nextId();
    const tid = nextId();
    const m1 = { ...makeMatch(nextId()), table_number: 42 };
    const m2 = { ...makeMatch(nextId()), table_number: 99 };
    await RoundModel.create({ id: rid, tournamentId: tid, results: [m1, m2] });
    const req = makeRequest('GET', `/api/rounds/${rid}/matchs?search=42`);
    const res = await getMatches(req, roundParams(String(rid)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.results.length).toBe(1);
    expect(data.results[0].table_number).toBe(42);
  });
});

describe('GET /api/rounds/[roundId]/matchs/[matchId]', () => {
  it('retourne 404 si le match n\'existe pas', async () => {
    const rid = nextId();
    await RoundModel.create({ id: rid, tournamentId: nextId(), results: [] });
    const req = new NextRequest(`http://localhost:3000/api/rounds/${rid}/matchs/999`);
    const res = await getMatch(req, matchParams(String(rid), '999'));
    expect(res.status).toBe(404);
  });

  it('retourne 200 avec le match', async () => {
    const rid = nextId();
    const mid = nextId();
    await RoundModel.create({ id: rid, tournamentId: nextId(), results: [makeMatch(mid)] });
    const req = new NextRequest(`http://localhost:3000/api/rounds/${rid}/matchs/${mid}`);
    const res = await getMatch(req, matchParams(String(rid), String(mid)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.id).toBe(mid);
  });
});

describe('POST /api/rounds/[roundId]/matchs/[matchId]/assign_deck', () => {
  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('POST', '/api/rounds/1/matchs/1/assign_deck', { decks: [] });
    const res = await assignDeck(req, matchParams('1', '1'));
    expect(res.status).toBe(401);
  });

  it('retourne 404 si le round n\'existe pas', async () => {
    const user = await createTestUser({ username: 'deckuser1', email: 'deckuser1@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('POST', '/api/rounds/999/matchs/1/assign_deck', { decks: [] }, cookie);
    const res = await assignDeck(req, matchParams('999', '1'));
    expect(res.status).toBe(404);
  });

  it('assigne des decks et retourne 200', async () => {
    const user = await createTestUser({ username: 'deckuser2', email: 'deckuser2@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const rid = nextId();
    const mid = nextId();
    await RoundModel.create({ id: rid, tournamentId: nextId(), results: [makeMatch(mid, 10, 11)] });
    const req = makeRequest('POST', `/api/rounds/${rid}/matchs/${mid}/assign_deck`, {
      decks: [{ playerId: 10, decks: [['Ambre', 'Rubis']] }],
    }, cookie);
    const res = await assignDeck(req, matchParams(String(rid), String(mid)));
    expect(res.status).toBe(200);
  });

  it('assigne un deck avec portée groupe et retourne 200', async () => {
    const owner = await createTestUser({ username: 'deckgroupuser1', email: 'deckgroupuser1@example.com' });
    const group = await createTestGroup(owner._id, { name: 'assign-group-1' });
    const rid = nextId();
    const mid = nextId();
    const tid = nextId();
    await TournamentModel.create({ id: tid, name: 'GT', event_status: 'ENDED', start_datetime: new Date(), tournament_phases: [] });
    await GroupTournamentModel.create({ groupId: group._id, tournamentId: tid, addedBy: owner._id, status: 'ACTIVE' });
    await RoundModel.create({ id: rid, tournamentId: tid, results: [makeMatch(mid, 20, 21)] });
    const cookie = await createAuthCookie(owner._id, 'USER');
    const req = makeRequest('POST', `/api/rounds/${rid}/matchs/${mid}/assign_deck`, {
      decks: [{ playerId: 20, decks: [['Amber', 'Sapphire']] }],
      groupId: String(group._id),
    }, cookie);
    const res = await assignDeck(req, matchParams(String(rid), String(mid)));
    expect(res.status).toBe(200);
    const saved = await TournamentPlayersDeckModel.findOne({ tournamentId: tid, groupId: String(group._id) });
    expect(saved).not.toBeNull();
  });

  it('retourne 403 si l\'utilisateur n\'est pas membre du groupe demandé', async () => {
    const owner = await createTestUser({ username: 'deckgroupuser2', email: 'deckgroupuser2@example.com' });
    const outsider = await createTestUser({ username: 'deckgroupuser3', email: 'deckgroupuser3@example.com' });
    const group = await createTestGroup(owner._id, { name: 'assign-group-2' });
    const rid = nextId();
    const mid = nextId();
    await RoundModel.create({ id: rid, tournamentId: nextId(), results: [makeMatch(mid, 30, 31)] });
    const cookie = await createAuthCookie(outsider._id, 'USER');
    const req = makeRequest('POST', `/api/rounds/${rid}/matchs/${mid}/assign_deck`, {
      decks: [],
      groupId: String(group._id),
    }, cookie);
    const res = await assignDeck(req, matchParams(String(rid), String(mid)));
    expect(res.status).toBe(403);
  });
});

describe('Cycle complet bicolorite — assign puis GET', () => {
  it('portee user — assigne puis GET retourne les bicolorites', async () => {
    const user = await createTestUser({ username: 'bicolo1', email: 'bicolo1@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const rid = nextId();
    const tid = nextId();
    const mid = nextId();
    const p1 = nextId();
    const p2 = nextId();

    await TournamentModel.create({ id: tid, name: 'T', event_status: 'ENDED', start_datetime: new Date(), tournament_phases: [] });
    await RoundModel.create({ id: rid, tournamentId: tid, results: [makeMatch(mid, p1, p2)] });

    const assignRes = await assignDeck(
      makeRequest('POST', `/api/rounds/${rid}/matchs/${mid}/assign_deck`, {
        decks: [
          { playerId: p1, decks: [['Ambre', 'Rubis']] },
          { playerId: p2, decks: [['Ambre', 'Rubis']] },
        ],
      }, cookie),
      matchParams(String(rid), String(mid)),
    );
    expect(assignRes.status).toBe(200);

    const getRes = await getMatches(
      makeRequest('GET', `/api/rounds/${rid}/matchs`, undefined, cookie),
      roundParams(String(rid)),
    );
    const data = await getRes.json();

    expect(getRes.status).toBe(200);
    const player1 = data.playersDecks?.players?.find((p: { playerId: number }) => p.playerId === p1);
    expect(player1).toBeDefined();
    expect(player1.decks).toEqual([['Ambre', 'Rubis']]);
  });

  it('portee groupe — assigne puis GET avec groupId retourne les bicolorites', async () => {
    const owner = await createTestUser({ username: 'bicolo2', email: 'bicolo2@test.com' });
    const group = await createTestGroup(owner._id, { name: 'bicolo-group-1' });
    const cookie = await createAuthCookie(owner._id, 'USER');
    const rid = nextId();
    const tid = nextId();
    const mid = nextId();
    const p1 = nextId();
    const p2 = nextId();

    await TournamentModel.create({ id: tid, name: 'T', event_status: 'ENDED', start_datetime: new Date(), tournament_phases: [] });
    await GroupTournamentModel.create({ groupId: group._id, tournamentId: tid, addedBy: owner._id, status: 'ACTIVE' });
    await RoundModel.create({ id: rid, tournamentId: tid, results: [makeMatch(mid, p1, p2)] });

    const assignRes = await assignDeck(
      makeRequest('POST', `/api/rounds/${rid}/matchs/${mid}/assign_deck`, {
        decks: [
          { playerId: p1, decks: [['Acier', 'Emeraude']] },
          { playerId: p2, decks: [['Acier', 'Emeraude']] },
        ],
        groupId: String(group._id),
      }, cookie),
      matchParams(String(rid), String(mid)),
    );
    expect(assignRes.status).toBe(200);

    const getRes = await getMatches(
      makeRequest('GET', `/api/rounds/${rid}/matchs?groupId=${group._id}`),
      roundParams(String(rid)),
    );
    const data = await getRes.json();

    expect(getRes.status).toBe(200);
    const player1 = data.playersDecks?.players?.find((p: { playerId: number }) => p.playerId === p1);
    expect(player1).toBeDefined();
    expect(player1.decks).toEqual([['Acier', 'Emeraude']]);
  });

  it('assign sans groupId va en scope user même si le tournoi appartient à un groupe de l\'user', async () => {
    const user = await createTestUser({ username: 'bicolo3', email: 'bicolo3@test.com' });
    const group = await createTestGroup(user._id, { name: 'bicolo-group-2' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const rid = nextId();
    const tid = nextId();
    const mid = nextId();
    const p1 = nextId();
    const p2 = nextId();

    await TournamentModel.create({ id: tid, name: 'T', event_status: 'ENDED', start_datetime: new Date(), tournament_phases: [] });
    await GroupTournamentModel.create({ groupId: group._id, tournamentId: tid, addedBy: user._id, status: 'ACTIVE' });
    await RoundModel.create({ id: rid, tournamentId: tid, results: [makeMatch(mid, p1, p2)] });

    // Assign sans groupId — doit utiliser le scope user (pas d'auto-détection de groupe)
    await assignDeck(
      makeRequest('POST', `/api/rounds/${rid}/matchs/${mid}/assign_deck`, {
        decks: [{ playerId: p1, decks: [['Ambre', 'Rubis']] }],
      }, cookie),
      matchParams(String(rid), String(mid)),
    );

    // Le scope user doit contenir le deck
    const userRes = await getMatches(
      makeRequest('GET', `/api/rounds/${rid}/matchs`, undefined, cookie),
      roundParams(String(rid)),
    );
    const userData = await userRes.json();
    expect(userRes.status).toBe(200);
    const player = userData.playersDecks?.players?.find((p: { playerId: number }) => p.playerId === p1);
    expect(player).toBeDefined();
    expect(player.decks).toEqual([['Ambre', 'Rubis']]);

    // Le scope groupe ne doit pas contenir le deck
    const TournamentPlayersDeckModel = (await import('@models/TournamentPlayersDeck')).default;
    const groupDoc = await TournamentPlayersDeckModel.findOne({ tournamentId: tid, groupId: group._id, userId: null });
    expect(groupDoc?.players?.find((p) => p.playerId === p1)?.decks?.length ?? 0).toBe(0);
  });

  it('reassignation — un second POST met a jour les bicolorites', async () => {
    const user = await createTestUser({ username: 'bicolo4', email: 'bicolo4@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const rid = nextId();
    const tid = nextId();
    const mid = nextId();
    const p1 = nextId();
    const p2 = nextId();

    await TournamentModel.create({ id: tid, name: 'T', event_status: 'ENDED', start_datetime: new Date(), tournament_phases: [] });
    await RoundModel.create({ id: rid, tournamentId: tid, results: [makeMatch(mid, p1, p2)] });

    await assignDeck(
      makeRequest('POST', `/api/rounds/${rid}/matchs/${mid}/assign_deck`, {
        decks: [{ playerId: p1, decks: [['Ambre', 'Rubis']] }],
      }, cookie),
      matchParams(String(rid), String(mid)),
    );

    await assignDeck(
      makeRequest('POST', `/api/rounds/${rid}/matchs/${mid}/assign_deck`, {
        decks: [{ playerId: p1, decks: [['Acier', 'Saphir']] }],
      }, cookie),
      matchParams(String(rid), String(mid)),
    );

    const getRes = await getMatches(
      makeRequest('GET', `/api/rounds/${rid}/matchs`, undefined, cookie),
      roundParams(String(rid)),
    );
    const data = await getRes.json();

    expect(getRes.status).toBe(200);
    const player1 = data.playersDecks?.players?.find((p: { playerId: number }) => p.playerId === p1);
    expect(player1).toBeDefined();
    expect(player1.decks).toEqual([['Acier', 'Saphir']]);
  });

  it('sans assignation prealable — playersDecks est null', async () => {
    const rid = nextId();
    const tid = nextId();
    await RoundModel.create({ id: rid, tournamentId: tid, results: [makeMatch(nextId())] });

    const getRes = await getMatches(
      makeRequest('GET', `/api/rounds/${rid}/matchs`),
      roundParams(String(rid)),
    );
    const data = await getRes.json();

    expect(getRes.status).toBe(200);
    expect(data.playersDecks).toBeNull();
  });
});

describe('POST /api/admin/fetchRound', () => {
  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('POST', '/api/admin/fetchRound', { tournamentId: 1, roundId: 1 });
    const res = await fetchRound(req);
    expect(res.status).toBe(401);
  });

  it('retourne 403 si rôle USER', async () => {
    const user = await createTestUser({ username: 'fr_user1', email: 'fr_user1@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('POST', '/api/admin/fetchRound', { tournamentId: 1, roundId: 1 }, cookie);
    const res = await fetchRound(req);
    expect(res.status).toBe(403);
  });

  it('retourne 400 sans tournamentId', async () => {
    const admin = await createAdminUser({ username: 'fr_admin1', email: 'fr_admin1@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('POST', '/api/admin/fetchRound', { roundId: 1 }, cookie);
    const res = await fetchRound(req);
    expect(res.status).toBe(400);
  });

  it('retourne 400 sans roundId', async () => {
    const admin = await createAdminUser({ username: 'fr_admin2', email: 'fr_admin2@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('POST', '/api/admin/fetchRound', { tournamentId: 1 }, cookie);
    const res = await fetchRound(req);
    expect(res.status).toBe(400);
  });

  it('retourne 500 si le round n\'existe pas dans le tournoi', async () => {
    const admin = await createAdminUser({ username: 'fr_admin3', email: 'fr_admin3@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const tid = nextId();
    await TournamentModel.create({ id: tid, name: 'T', event_status: 'ENDED', start_datetime: new Date(), tournament_phases: [] });
    const req = makeRequest('POST', '/api/admin/fetchRound', { tournamentId: tid, roundId: 999 }, cookie);
    const res = await fetchRound(req);
    expect(res.status).toBe(500);
  });

  it('fetche et sauvegarde un round via RavensburgerClient', async () => {
    const admin = await createAdminUser({ username: 'fr_admin4', email: 'fr_admin4@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const tid = nextId();
    const rid = nextId();
    const mid = nextId();
    await TournamentModel.create({
      id: tid,
      name: 'T',
      event_status: 'ENDED',
      start_datetime: new Date(),
      tournament_phases: [{ id: 1, status: 'COMPLETE', order_in_phases: 1, number_of_rounds: 1, round_type: 'SWISS', first_round_type: null, rank_required_to_enter_phase: null, rounds: [{ id: rid, round_number: 1, final_round_in_event: true, pairings_status: 'PUBLISHED', standings_status: 'PUBLISHED', round_type: 'SWISS', status: 'COMPLETE' }] }],
    });

    vi.mocked(RavensburgerClient.fetchRound).mockResolvedValue({
      id: rid,
      total: 1,
      results: [makeMatch(mid)],
    } as never);

    const req = makeRequest('POST', '/api/admin/fetchRound', { tournamentId: tid, roundId: rid }, cookie);
    const res = await fetchRound(req);
    expect(res.status).toBe(200);
    const saved = await RoundModel.findOne({ id: rid });
    expect(saved).not.toBeNull();
  });
});

describe('POST /api/rounds/fetch', () => {
  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('POST', '/api/rounds/fetch', { tournamentId: 1, roundId: 1 });
    const res = await fetchRoundUser(req);
    expect(res.status).toBe(401);
  });

  it('retourne 200 avec rôle USER', async () => {
    const user = await createTestUser({ username: 'rfu_user1', email: 'rfu_user1@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextId();
    const rid = nextId();
    const mid = nextId();
    await TournamentModel.create({
      id: tid,
      name: 'T',
      event_status: 'ENDED',
      start_datetime: new Date(),
      tournament_phases: [{ id: 1, status: 'COMPLETE', order_in_phases: 1, number_of_rounds: 1, round_type: 'SWISS', first_round_type: null, rank_required_to_enter_phase: null, rounds: [{ id: rid, round_number: 1, final_round_in_event: true, pairings_status: 'PUBLISHED', standings_status: 'PUBLISHED', round_type: 'SWISS', status: 'COMPLETE' }] }],
    });
    vi.mocked(RavensburgerClient.fetchRound).mockResolvedValue({
      id: rid, total: 1, results: [makeMatch(mid)],
    } as never);
    const req = makeRequest('POST', '/api/rounds/fetch', { tournamentId: tid, roundId: rid }, cookie);
    const res = await fetchRoundUser(req);
    expect(res.status).toBe(200);
    const saved = await RoundModel.findOne({ id: rid });
    expect(saved).not.toBeNull();
  });

  it('retourne 200 avec rôle ADMIN', async () => {
    const admin = await createAdminUser({ username: 'rfu_admin1', email: 'rfu_admin1@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const tid = nextId();
    const rid = nextId();
    const mid = nextId();
    await TournamentModel.create({
      id: tid,
      name: 'T',
      event_status: 'ENDED',
      start_datetime: new Date(),
      tournament_phases: [{ id: 1, status: 'COMPLETE', order_in_phases: 1, number_of_rounds: 1, round_type: 'SWISS', first_round_type: null, rank_required_to_enter_phase: null, rounds: [{ id: rid, round_number: 1, final_round_in_event: true, pairings_status: 'PUBLISHED', standings_status: 'PUBLISHED', round_type: 'SWISS', status: 'COMPLETE' }] }],
    });
    vi.mocked(RavensburgerClient.fetchRound).mockResolvedValue({
      id: rid, total: 1, results: [makeMatch(mid)],
    } as never);
    const req = makeRequest('POST', '/api/rounds/fetch', { tournamentId: tid, roundId: rid }, cookie);
    const res = await fetchRoundUser(req);
    expect(res.status).toBe(200);
  });

  it('retourne 400 sans tournamentId', async () => {
    const user = await createTestUser({ username: 'rfu_user2', email: 'rfu_user2@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('POST', '/api/rounds/fetch', { roundId: 1 }, cookie);
    const res = await fetchRoundUser(req);
    expect(res.status).toBe(400);
  });

  it('retourne 400 sans roundId', async () => {
    const user = await createTestUser({ username: 'rfu_user3', email: 'rfu_user3@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('POST', '/api/rounds/fetch', { tournamentId: 1 }, cookie);
    const res = await fetchRoundUser(req);
    expect(res.status).toBe(400);
  });

  it('retourne 429 si refetch trop rapide', async () => {
    const user = await createTestUser({ username: 'rfu_user4', email: 'rfu_user4@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextId();
    const rid = nextId();
    await TournamentModel.create({ id: tid, name: 'T', event_status: 'ENDED', start_datetime: new Date(), tournament_phases: [] });
    await RoundModel.create({ id: rid, tournamentId: tid, results: [], lastFetchedAt: new Date() });
    const req = makeRequest('POST', '/api/rounds/fetch', { tournamentId: tid, roundId: rid }, cookie);
    const res = await fetchRoundUser(req);
    expect(res.status).toBe(429);
  });
});
