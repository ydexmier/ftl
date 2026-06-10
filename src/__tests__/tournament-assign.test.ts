import { describe, it, expect } from 'vitest';
import { POST as assignDeckPlayers } from '../../app/api/tournaments/[id]/players/[playerId]/assign_deck/route';
import TournamentModel from '@models/Tournament';
import RoundModel from '@models/Round';
import TournamentPlayersDeckModel from '@models/TournamentPlayersDeck';
import { createTestUser, createAuthCookie, makeRequest } from '../test/helpers';

let _counter = 0;
function nextId() { return 600000 + ++_counter; }

function params(id: string, playerId: string) {
  return { params: Promise.resolve({ id, playerId }) };
}

function makeRoundWithPlayer(playerId: number, bestId = 'Alice') {
  return {
    id: nextId(),
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
    winning_player: playerId,
    reporting_player: null,
    assigned_judge: null,
    players: [playerId],
    player_match_relationships: [
      {
        player_order: 1,
        player: { id: playerId, best_identifier: bestId, pronouns: null, game_user_profile_picture_url: null },
        user_event_status: { id: playerId, best_identifier: bestId, registration_status: 'CHECKED_IN', matches_won: 1, matches_lost: 0, matches_drawn: 0, total_match_points: 3 },
      },
    ],
  };
}

// ─── POST /api/tournaments/[id]/players/[playerId]/assign_deck ────────────────

describe('POST /api/tournaments/[id]/players/[playerId]/assign_deck', () => {
  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('POST', '/api/tournaments/1/players/1/assign_deck', { decks: [] });
    const res = await assignDeckPlayers(req, params('1', '1'));
    expect(res.status).toBe(401);
  });

  it('retourne 400 si tournamentId invalide', async () => {
    const user = await createTestUser({ username: 'ad1', email: 'ad1@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('POST', '/api/tournaments/abc/players/1/assign_deck', { decks: [] }, cookie);
    const res = await assignDeckPlayers(req, params('abc', '1'));
    expect(res.status).toBe(400);
  });

  it('retourne 404 si le joueur n\'existe pas dans les rondes', async () => {
    const tid = nextId();
    const rid = nextId();
    await TournamentModel.create({ id: tid, name: 'T1', event_status: 'ENDED', start_datetime: new Date(), tournament_phases: [] });
    await RoundModel.create({ id: rid, tournamentId: tid, results: [{ ...makeRoundWithPlayer(42), id: nextId() }] });
    const user = await createTestUser({ username: 'ad2', email: 'ad2@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest(
      'POST',
      `/api/tournaments/${tid}/players/9999/assign_deck`,
      { decks: [['Amber', 'Ruby']] },
      cookie,
    );
    const res = await assignDeckPlayers(req, params(String(tid), '9999'));
    expect(res.status).toBe(404);
  });

  it('assigne un deck à un joueur (portée utilisateur) et retourne 200', async () => {
    const tid = nextId();
    const rid = nextId();
    const playerId = nextId();
    await TournamentModel.create({ id: tid, name: 'T2', event_status: 'ENDED', start_datetime: new Date(), tournament_phases: [] });
    await RoundModel.create({ id: rid, tournamentId: tid, results: [{ ...makeRoundWithPlayer(playerId, 'Charlie'), id: nextId() }] });
    const user = await createTestUser({ username: 'ad3', email: 'ad3@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest(
      'POST',
      `/api/tournaments/${tid}/players/${playerId}/assign_deck`,
      { decks: [['Amber', 'Ruby']] },
      cookie,
    );
    const res = await assignDeckPlayers(req, params(String(tid), String(playerId)));
    expect(res.status).toBe(200);
    const deck = await TournamentPlayersDeckModel.findOne({ tournamentId: tid, userId: String(user._id) });
    expect(deck).not.toBeNull();
    const player = deck?.players.find((p) => p.playerId === playerId);
    expect(player?.decks).toEqual([['Amber', 'Ruby']]);
  });
});
