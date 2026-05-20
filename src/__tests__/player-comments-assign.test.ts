import { describe, it, expect } from 'vitest';
import { POST as assignDeckTournament } from '../../app/api/tournaments/[id]/players/[playerId]/assign_deck/route';
import RoundModel from '@models/Round';
import { PlayerCommentRepository } from '@/src/repositories/db/PlayerCommentRepository';
import { createTestUser, createAuthCookie, createTestGroup, makeRequest } from '../test/helpers';

let _counter = 0;
function nextId() { return 700000 + ++_counter; }

function params(id: string, playerId: string) {
  return { params: Promise.resolve({ id, playerId }) };
}

async function seedRound(tournamentId: number, playerId: number) {
  await RoundModel.create({
    id: nextId(),
    tournamentId,
    lastFetchedAt: new Date(),
    results: [
      {
        id: nextId(),
        table_number: 1,
        match_is_bye: false,
        match_is_loss: false,
        match_is_intentional_draw: false,
        match_is_unintentional_draw: false,
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
        status: 'COMPLETE',
        order: 1,
        pod_number: null,
        winning_player: playerId,
        reporting_player: null,
        assigned_judge: null,
        players: [playerId],
        player_match_relationships: [
          {
            player_order: 1,
            player: { id: playerId, best_identifier: 'TestPlayer', pronouns: null, game_user_profile_picture_url: null },
            user_event_status: { id: playerId, best_identifier: 'TestPlayer', registration_status: 'CHECKED_IN', matches_won: 1, matches_lost: 0, matches_drawn: 0, total_match_points: 3 },
          },
        ],
      },
    ],
  });
}

// ─── assign_deck — contrôle d'accès groupe ────────────────────────────────────

describe('POST /api/tournaments/:id/players/:playerId/assign_deck — accès groupe', () => {
  it('retourne 403 si l\'utilisateur n\'est pas membre du groupe fourni', async () => {
    const tid = nextId();
    const pid = nextId();
    const owner = await createTestUser({ username: `owner-${pid}`, email: `owner${pid}@test.com` });
    const outsider = await createTestUser({ username: `out-${pid}`, email: `out${pid}@test.com` });
    const group = await createTestGroup(owner._id);
    const cookie = await createAuthCookie(outsider._id, 'USER');
    await seedRound(tid, pid);

    const req = makeRequest(
      'POST',
      `/api/tournaments/${tid}/players/${pid}/assign_deck`,
      { decks: [['Amber']], groupId: String(group._id) },
      cookie,
    );
    const res = await assignDeckTournament(req, params(String(tid), String(pid)));
    expect(res.status).toBe(403);
  });
});

// ─── assign_deck tournament + comment ────────────────────────────────────────

describe('POST /api/tournaments/:id/players/:playerId/assign_deck avec commentaire', () => {
  it("crée un PlayerComment si comment non vide et deck non vide", async () => {
    const tid = nextId();
    const pid = nextId();
    const user = await createTestUser({ username: `u-${pid}`, email: `u${pid}@test.com` });
    const cookie = await createAuthCookie(user._id, 'USER');
    await seedRound(tid, pid);

    const req = makeRequest(
      'POST',
      `/api/tournaments/${tid}/players/${pid}/assign_deck`,
      { decks: [['Amber', 'Amethyst']], comment: 'Joue agressif' },
      cookie,
    );
    const res = await assignDeckTournament(req, params(String(tid), String(pid)));
    expect(res.status).toBe(200);

    const comments = await PlayerCommentRepository.findByPlayer(tid, pid, { groupId: null });
    expect(comments).toHaveLength(1);
    expect(comments[0].content).toBe('Joue agressif');
    expect(comments[0].inks).toEqual(['Amber', 'Amethyst']);
  });

  it("ne crée pas de PlayerComment si comment est vide", async () => {
    const tid = nextId();
    const pid = nextId();
    const user = await createTestUser({ username: `u-${pid}`, email: `u${pid}@test.com` });
    const cookie = await createAuthCookie(user._id, 'USER');
    await seedRound(tid, pid);

    const req = makeRequest(
      'POST',
      `/api/tournaments/${tid}/players/${pid}/assign_deck`,
      { decks: [['Ruby']], comment: '   ' },
      cookie,
    );
    await assignDeckTournament(req, params(String(tid), String(pid)));

    const comments = await PlayerCommentRepository.findByPlayer(tid, pid, { groupId: null });
    expect(comments).toHaveLength(0);
  });

  it("ne crée pas de PlayerComment si decks est vide même avec un comment", async () => {
    const tid = nextId();
    const pid = nextId();
    const user = await createTestUser({ username: `u-${pid}`, email: `u${pid}@test.com` });
    const cookie = await createAuthCookie(user._id, 'USER');
    await seedRound(tid, pid);

    const req = makeRequest(
      'POST',
      `/api/tournaments/${tid}/players/${pid}/assign_deck`,
      { decks: [], comment: 'Note orpheline' },
      cookie,
    );
    await assignDeckTournament(req, params(String(tid), String(pid)));

    const comments = await PlayerCommentRepository.findByPlayer(tid, pid, { groupId: null });
    expect(comments).toHaveLength(0);
  });

  it("crée un PlayerComment en portée groupe si groupId fourni", async () => {
    const tid = nextId();
    const pid = nextId();
    const user = await createTestUser({ username: `u-${pid}`, email: `u${pid}@test.com` });
    const group = await createTestGroup(user._id);
    const cookie = await createAuthCookie(user._id, 'USER');
    await seedRound(tid, pid);

    const req = makeRequest(
      'POST',
      `/api/tournaments/${tid}/players/${pid}/assign_deck`,
      { decks: [['Steel', 'Ruby']], groupId: String(group._id), comment: 'Note groupe' },
      cookie,
    );
    const res = await assignDeckTournament(req, params(String(tid), String(pid)));
    expect(res.status).toBe(200);

    const comments = await PlayerCommentRepository.findByPlayer(tid, pid, { groupId: String(group._id) });
    expect(comments).toHaveLength(1);
    expect(comments[0].content).toBe('Note groupe');
  });

  it("ne crée pas de PlayerComment si pas de comment dans le body", async () => {
    const tid = nextId();
    const pid = nextId();
    const user = await createTestUser({ username: `u-${pid}`, email: `u${pid}@test.com` });
    const cookie = await createAuthCookie(user._id, 'USER');
    await seedRound(tid, pid);

    const req = makeRequest(
      'POST',
      `/api/tournaments/${tid}/players/${pid}/assign_deck`,
      { decks: [['Amber']] },
      cookie,
    );
    await assignDeckTournament(req, params(String(tid), String(pid)));

    const comments = await PlayerCommentRepository.findByPlayer(tid, pid, { groupId: null });
    expect(comments).toHaveLength(0);
  });
});
