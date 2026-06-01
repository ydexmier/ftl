import { describe, it, expect } from 'vitest';
import { GET as getHistory } from '../../app/api/tournaments/[id]/players/[playerId]/history/route';
import RoundModel from '@models/Round';
import TournamentPlayersDeckModel from '@models/TournamentPlayersDeck';
import TournamentExternalAccessModel from '@models/TournamentExternalAccess';
import { createTestUser, createTestGroup, createAuthCookie, makeRequest } from '../test/helpers';

let _counter = 0;
function nextId() { return 800000 + ++_counter; }

function params(id: string, playerId: string) {
  return { params: Promise.resolve({ id, playerId }) };
}

function makeMatch(id: number, opts: {
  player1Id?: number;
  player1Name?: string;
  player2Id?: number;
  player2Name?: string;
  winnerId?: number | null;
  isBye?: boolean;
  isDraw?: boolean;
  gamesWonByWinner?: number;
  gamesWonByLoser?: number;
  status?: string;
} = {}) {
  const {
    player1Id = 1, player1Name = 'Alice',
    player2Id = 2, player2Name = 'Bob',
    winnerId = player1Id,
    isBye = false,
    isDraw = false,
    gamesWonByWinner = 2,
    gamesWonByLoser = 0,
    status = 'COMPLETE',
  } = opts;
  return {
    id,
    table_number: 1,
    order: 1,
    status,
    pod_number: null,
    match_is_bye: isBye,
    match_is_intentional_draw: isDraw,
    match_is_unintentional_draw: false,
    match_is_loss: false,
    reports_are_in_conflict: false,
    games_drawn: null,
    games_won_by_winner: isDraw ? null : gamesWonByWinner,
    games_won_by_loser: isDraw ? null : gamesWonByLoser,
    is_ghost_match: false,
    is_feature_match: false,
    deck_check_started: false,
    deck_check_completed: false,
    time_extension_seconds: 0,
    tournament_round: 1,
    winning_player: isDraw ? null : winnerId,
    reporting_player: null,
    assigned_judge: null,
    players: [player1Id, player2Id],
    player_match_relationships: [
      { player_order: 1, player: { id: player1Id, best_identifier: player1Name, pronouns: null, game_user_profile_picture_url: null }, user_event_status: { id: player1Id, best_identifier: player1Name, registration_status: 'CHECKED_IN', matches_won: 1, matches_lost: 0, matches_drawn: 0, total_match_points: 3 } },
      { player_order: 2, player: { id: player2Id, best_identifier: player2Name, pronouns: null, game_user_profile_picture_url: null }, user_event_status: { id: player2Id, best_identifier: player2Name, registration_status: 'CHECKED_IN', matches_won: 0, matches_lost: 1, matches_drawn: 0, total_match_points: 0 } },
    ],
  };
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

describe('GET /api/tournaments/[id]/players/[playerId]/history — auth', () => {
  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('GET', '/api/tournaments/1/players/1/history');
    const res = await getHistory(req, params('1', '1'));
    expect(res.status).toBe(401);
  });

  it('retourne 400 si les parametres sont invalides', async () => {
    const user = await createTestUser({ username: 'h_auth1', email: 'h_auth1@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', '/api/tournaments/abc/players/xyz/history', undefined, cookie);
    const res = await getHistory(req, params('abc', 'xyz'));
    expect(res.status).toBe(400);
  });
});

// ─── Portee utilisateur ────────────────────────────────────────────────────────

describe("GET /api/tournaments/[id]/players/[playerId]/history — portee utilisateur", () => {
  it('retourne un historique vide si aucune ronde', async () => {
    const user = await createTestUser({ username: 'h_user1', email: 'h_user1@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextId();

    const req = makeRequest('GET', `/api/tournaments/${tid}/players/1/history`, undefined, cookie);
    const res = await getHistory(req, params(String(tid), '1'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.history).toEqual([]);
  });

  it('retourne les resultats WIN et LOSS avec le bon score', async () => {
    const user = await createTestUser({ username: 'h_user2', email: 'h_user2@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextId();
    const aliceId = nextId();
    const bobId = nextId();
    const charlieId = nextId();

    const rid1 = nextId();
    await RoundModel.create({ id: rid1, tournamentId: tid, results: [
      makeMatch(nextId(), { player1Id: aliceId, player1Name: 'Alice', player2Id: bobId, player2Name: 'Bob', winnerId: aliceId, gamesWonByWinner: 2, gamesWonByLoser: 0 }),
    ]});

    const rid2 = nextId();
    await RoundModel.create({ id: rid2, tournamentId: tid, results: [
      makeMatch(nextId(), { player1Id: aliceId, player1Name: 'Alice', player2Id: charlieId, player2Name: 'Charlie', winnerId: charlieId, gamesWonByWinner: 2, gamesWonByLoser: 1 }),
    ]});

    const req = makeRequest('GET', `/api/tournaments/${tid}/players/${aliceId}/history`, undefined, cookie);
    const res = await getHistory(req, params(String(tid), String(aliceId)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.history).toHaveLength(2);

    const [r1, r2] = data.history;
    expect(r1.roundNumber).toBe(1);
    expect(r1.result).toBe('WIN');
    expect(r1.opponentName).toBe('Bob');
    expect(r1.gamesWon).toBe(2);
    expect(r1.gamesLost).toBe(0);

    expect(r2.roundNumber).toBe(2);
    expect(r2.result).toBe('LOSS');
    expect(r2.opponentName).toBe('Charlie');
    expect(r2.gamesWon).toBe(1);
    expect(r2.gamesLost).toBe(2);
  });

  it('retourne BYE quand le match est un bye', async () => {
    const user = await createTestUser({ username: 'h_user3', email: 'h_user3@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextId();
    const aliceId = nextId();
    const rid = nextId();

    await RoundModel.create({ id: rid, tournamentId: tid, results: [
      makeMatch(nextId(), { player1Id: aliceId, player1Name: 'Alice', player2Id: 0, player2Name: 'BYE', isBye: true, winnerId: null }),
    ]});

    const req = makeRequest('GET', `/api/tournaments/${tid}/players/${aliceId}/history`, undefined, cookie);
    const res = await getHistory(req, params(String(tid), String(aliceId)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.history[0].result).toBe('BYE');
  });

  it('saute les rondes ou le joueur ne participe pas', async () => {
    const user = await createTestUser({ username: 'h_user4', email: 'h_user4@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextId();
    const aliceId = nextId();
    const bobId = nextId();
    const charlieId = nextId();
    const davidId = nextId();

    const rid1 = nextId();
    await RoundModel.create({ id: rid1, tournamentId: tid, results: [
      makeMatch(nextId(), { player1Id: aliceId, player1Name: 'Alice', player2Id: bobId, player2Name: 'Bob', winnerId: aliceId }),
    ]});

    const rid2 = nextId();
    await RoundModel.create({ id: rid2, tournamentId: tid, results: [
      makeMatch(nextId(), { player1Id: charlieId, player1Name: 'Charlie', player2Id: davidId, player2Name: 'David', winnerId: charlieId }),
    ]});

    const req = makeRequest('GET', `/api/tournaments/${tid}/players/${aliceId}/history`, undefined, cookie);
    const res = await getHistory(req, params(String(tid), String(aliceId)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.history).toHaveLength(1);
    expect(data.history[0].roundNumber).toBe(1);
  });

  it('inclut les decks de l adversaire depuis la portee utilisateur', async () => {
    const user = await createTestUser({ username: 'h_user5', email: 'h_user5@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextId();
    const aliceId = nextId();
    const bobId = nextId();
    const rid = nextId();

    await RoundModel.create({ id: rid, tournamentId: tid, results: [
      makeMatch(nextId(), { player1Id: aliceId, player1Name: 'Alice', player2Id: bobId, player2Name: 'Bob', winnerId: aliceId }),
    ]});

    await TournamentPlayersDeckModel.create({
      tournamentId: tid,
      groupId: null,
      userId: String(user._id),
      players: [
        { playerId: bobId, best_identifier: 'Bob', pronouns: null, event_best_identifier: 'Bob', decks: [['Ruby', 'Sapphire']] },
      ],
    });

    const req = makeRequest('GET', `/api/tournaments/${tid}/players/${aliceId}/history`, undefined, cookie);
    const res = await getHistory(req, params(String(tid), String(aliceId)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.history[0].opponentDecks).toEqual([['Ruby', 'Sapphire']]);
  });
});

// ─── Portee groupe — controle d acces ─────────────────────────────────────────

describe("GET /api/tournaments/[id]/players/[playerId]/history — portee groupe", () => {
  it("retourne 403 si l utilisateur n est pas membre du groupe et n a pas d acces invite", async () => {
    const user = await createTestUser({ username: 'h_grp1', email: 'h_grp1@test.com' });
    const admin = await createTestUser({ username: 'h_grp1_admin', email: 'h_grp1_admin@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const group = await createTestGroup(admin._id);
    const tid = nextId();

    const req = makeRequest('GET', `/api/tournaments/${tid}/players/1/history?groupId=${group._id}`, undefined, cookie);
    const res = await getHistory(req, params(String(tid), '1'));
    expect(res.status).toBe(403);
  });

  it("retourne 200 si l utilisateur est membre du groupe", async () => {
    const user = await createTestUser({ username: 'h_grp2', email: 'h_grp2@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const group = await createTestGroup(user._id);
    const tid = nextId();
    const aliceId = nextId();
    const rid = nextId();

    await RoundModel.create({ id: rid, tournamentId: tid, results: [
      makeMatch(nextId(), { player1Id: aliceId, player1Name: 'Alice', player2Id: nextId(), player2Name: 'Bob', winnerId: aliceId }),
    ]});

    const req = makeRequest('GET', `/api/tournaments/${tid}/players/${aliceId}/history?groupId=${group._id}`, undefined, cookie);
    const res = await getHistory(req, params(String(tid), String(aliceId)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.history).toHaveLength(1);
    expect(data.history[0].result).toBe('WIN');
  });

  it('retourne 200 pour un guest avec acces accepte au groupe+tournoi', async () => {
    const guest = await createTestUser({ username: 'h_guest1', email: 'h_guest1@test.com' });
    const admin = await createTestUser({ username: 'h_guest1_admin', email: 'h_guest1_admin@test.com' });
    const cookie = await createAuthCookie(guest._id, 'USER');
    const group = await createTestGroup(admin._id);
    const tid = nextId();
    const aliceId = nextId();
    const rid = nextId();

    await TournamentExternalAccessModel.create({
      groupId: group._id,
      tournamentId: tid,
      userId: guest._id,
      invitedBy: admin._id,
      displayName: 'Guest',
      status: 'ACCEPTED',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await RoundModel.create({ id: rid, tournamentId: tid, results: [
      makeMatch(nextId(), { player1Id: aliceId, player1Name: 'Alice', player2Id: nextId(), player2Name: 'Bob', winnerId: aliceId }),
    ]});

    const req = makeRequest('GET', `/api/tournaments/${tid}/players/${aliceId}/history?groupId=${group._id}`, undefined, cookie);
    const res = await getHistory(req, params(String(tid), String(aliceId)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.history).toHaveLength(1);
  });

  it('utilise les decks de la portee groupe', async () => {
    const user = await createTestUser({ username: 'h_grp3', email: 'h_grp3@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const group = await createTestGroup(user._id);
    const tid = nextId();
    const aliceId = nextId();
    const bobId = nextId();
    const rid = nextId();

    await RoundModel.create({ id: rid, tournamentId: tid, results: [
      makeMatch(nextId(), { player1Id: aliceId, player1Name: 'Alice', player2Id: bobId, player2Name: 'Bob', winnerId: aliceId }),
    ]});

    await TournamentPlayersDeckModel.create({
      tournamentId: tid,
      groupId: String(group._id),
      userId: null,
      players: [
        { playerId: bobId, best_identifier: 'Bob', pronouns: null, event_best_identifier: 'Bob', decks: [['Emerald', 'Amber']] },
      ],
    });

    const req = makeRequest('GET', `/api/tournaments/${tid}/players/${aliceId}/history?groupId=${group._id}`, undefined, cookie);
    const res = await getHistory(req, params(String(tid), String(aliceId)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.history[0].opponentDecks).toEqual([['Amber', 'Emerald']]);
  });
});
