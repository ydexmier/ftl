import { describe, it, expect } from 'vitest';
import { GET as getStats } from '../../app/api/tournaments/[id]/stats/route';
import TournamentModel from '@models/Tournament';
import TournamentPlayersDeckModel from '@models/TournamentPlayersDeck';
import RoundModel from '@models/Round';
import { createTestUser, createAdminUser, createTestGroup, createAuthCookie, makeRequest } from '../test/helpers';

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

let _counter = 0;
function nextId() { return 900000 + ++_counter; }

async function seedTournament() {
  const tid = nextId();
  await TournamentModel.create({
    id: tid,
    name: `Stats Tournament ${tid}`,
    event_status: 'ENDED',
    start_datetime: new Date(),
    tournament_phases: [],
  });
  return tid;
}

function makeMatch(id: number, p1: number, p2: number, winner: number, gamesWon = 2, gamesLost = 0) {
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
    games_won_by_winner: gamesWon,
    games_won_by_loser: gamesLost,
    is_ghost_match: false,
    is_feature_match: false,
    deck_check_started: false,
    deck_check_completed: false,
    time_extension_seconds: 0,
    tournament_round: 1,
    winning_player: winner,
    reporting_player: null,
    assigned_judge: null,
    players: [p1, p2],
    player_match_relationships: [
      { player_order: 1, player: { id: p1, best_identifier: `Player${p1}`, pronouns: null, game_user_profile_picture_url: null }, user_event_status: { id: p1, best_identifier: `Player${p1}`, registration_status: 'CHECKED_IN', matches_won: 1, matches_lost: 0, matches_drawn: 0, total_match_points: 3 } },
      { player_order: 2, player: { id: p2, best_identifier: `Player${p2}`, pronouns: null, game_user_profile_picture_url: null }, user_event_status: { id: p2, best_identifier: `Player${p2}`, registration_status: 'CHECKED_IN', matches_won: 0, matches_lost: 1, matches_drawn: 0, total_match_points: 0 } },
    ],
  };
}

describe('GET /api/tournaments/[id]/stats', () => {
  it('retourne 401 sans cookie', async () => {
    const tid = await seedTournament();
    const req = makeRequest('GET', `/api/tournaments/${tid}/stats`);
    const res = await getStats(req, params(String(tid)));
    expect(res.status).toBe(401);
  });

  it('retourne 400 pour un id de tournoi invalide', async () => {
    const user = await createTestUser({ username: 'stats_user1', email: 'stats_user1@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', '/api/tournaments/invalid/stats', undefined, cookie);
    const res = await getStats(req, params('invalid'));
    expect(res.status).toBe(400);
  });

  it('retourne 403 si groupId fourni et utilisateur non-membre', async () => {
    const owner = await createTestUser({ username: 'stats_owner1', email: 'stats_owner1@example.com' });
    const outsider = await createTestUser({ username: 'stats_outsider1', email: 'stats_outsider1@example.com' });
    const group = await createTestGroup(owner._id, { name: 'stats-group-1' });
    const tid = await seedTournament();

    const cookie = await createAuthCookie(outsider._id, 'USER');
    const req = makeRequest('GET', `/api/tournaments/${tid}/stats?groupId=${group._id}`, undefined, cookie);
    const res = await getStats(req, params(String(tid)));
    expect(res.status).toBe(403);
  });

  it('retourne des stats vides pour un tournoi sans données', async () => {
    const user = await createTestUser({ username: 'stats_user2', email: 'stats_user2@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = await seedTournament();

    const req = makeRequest('GET', `/api/tournaments/${tid}/stats`, undefined, cookie);
    const res = await getStats(req, params(String(tid)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.scoutingProgress).toEqual({ total: 0, fullyScouted: 0, partiallyScouted: 0, unscouted: 0 });
    expect(data.inkDistribution).toEqual([]);
    expect(data.matchupMatrix.entries).toEqual([]);
    expect(data.matchupMatrix.decks).toEqual([]);
  });

  it('retourne scoutingProgress correct selon les decks connus', async () => {
    const user = await createTestUser({ username: 'stats_user3', email: 'stats_user3@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = await seedTournament();

    // 1 fully scouted, 1 partially scouted (2 deck possibilities), 1 unscouted
    await TournamentPlayersDeckModel.create({
      tournamentId: tid,
      groupId: null,
      userId: user._id,
      players: [
        { playerId: nextId(), best_identifier: 'Alice', event_best_identifier: '', decks: [['Amber', 'Sapphire']] },
        { playerId: nextId(), best_identifier: 'Bob', event_best_identifier: '', decks: [['Amber', 'Ruby'], ['Emerald', 'Steel']] },
        { playerId: nextId(), best_identifier: 'Carol', event_best_identifier: '', decks: [] },
      ],
    });

    const req = makeRequest('GET', `/api/tournaments/${tid}/stats`, undefined, cookie);
    const res = await getStats(req, params(String(tid)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.scoutingProgress.total).toBe(3);
    expect(data.scoutingProgress.fullyScouted).toBe(1);
    expect(data.scoutingProgress.partiallyScouted).toBe(1);
    expect(data.scoutingProgress.unscouted).toBe(1);
  });

  it('retourne inkDistribution avec les bonnes bicolorités et counts', async () => {
    const user = await createTestUser({ username: 'stats_user4', email: 'stats_user4@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = await seedTournament();

    await TournamentPlayersDeckModel.create({
      tournamentId: tid,
      groupId: null,
      userId: user._id,
      players: [
        { playerId: nextId(), best_identifier: 'P1', event_best_identifier: '', decks: [['Amber', 'Sapphire']] },
        { playerId: nextId(), best_identifier: 'P2', event_best_identifier: '', decks: [['Amber', 'Sapphire']] },
        { playerId: nextId(), best_identifier: 'P3', event_best_identifier: '', decks: [['Emerald', 'Ruby']] },
      ],
    });

    const req = makeRequest('GET', `/api/tournaments/${tid}/stats`, undefined, cookie);
    const res = await getStats(req, params(String(tid)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.inkDistribution).toHaveLength(2);
    // Sorted by count desc: Amber/Sapphire (2) then Emerald/Ruby (1)
    expect(data.inkDistribution[0].inks).toEqual(['Amber', 'Sapphire']);
    expect(data.inkDistribution[0].count).toBe(2);
    expect(data.inkDistribution[1].inks).toEqual(['Emerald', 'Ruby']);
    expect(data.inkDistribution[1].count).toBe(1);
  });

  it('retourne matchupMatrix avec win rates corrects', async () => {
    const user = await createTestUser({ username: 'stats_user5', email: 'stats_user5@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = await seedTournament();
    const p1 = nextId();
    const p2 = nextId();

    // Player 1: Amber/Sapphire, Player 2: Emerald/Ruby
    await TournamentPlayersDeckModel.create({
      tournamentId: tid,
      groupId: null,
      userId: user._id,
      players: [
        { playerId: p1, best_identifier: 'P1', event_best_identifier: '', decks: [['Amber', 'Sapphire']] },
        { playerId: p2, best_identifier: 'P2', event_best_identifier: '', decks: [['Emerald', 'Ruby']] },
      ],
    });

    // P1 wins 2-1 over P2
    await RoundModel.create({
      id: nextId(),
      tournamentId: tid,
      results: [makeMatch(nextId(), p1, p2, p1, 2, 1)],
    });

    const req = makeRequest('GET', `/api/tournaments/${tid}/stats`, undefined, cookie);
    const res = await getStats(req, params(String(tid)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.matchupMatrix.entries).toHaveLength(1);
    const entry = data.matchupMatrix.entries[0];
    // canonA = "Amber/Sapphire" (< "Emerald/Ruby" alphabetically)
    expect(entry.deckA).toBe('Amber/Sapphire');
    expect(entry.deckB).toBe('Emerald/Ruby');
    expect(entry.winsA).toBe(2);
    expect(entry.winsB).toBe(1);
    expect(data.matchupMatrix.decks).toContain('Amber/Sapphire');
    expect(data.matchupMatrix.decks).toContain('Emerald/Ruby');
  });

  it('admin peut accéder au scope groupe sans en être membre', async () => {
    const admin = await createAdminUser({ username: 'stats_admin1', email: 'stats_admin1@example.com' });
    const owner = await createTestUser({ username: 'stats_owner2', email: 'stats_owner2@example.com' });
    const group = await createTestGroup(owner._id, { name: 'stats-group-2' });
    const tid = await seedTournament();

    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('GET', `/api/tournaments/${tid}/stats?groupId=${group._id}`, undefined, cookie);
    const res = await getStats(req, params(String(tid)));
    expect(res.status).toBe(200);
  });
});
