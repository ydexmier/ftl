import { describe, it, expect } from 'vitest';
import { GET as getCommentCounts } from '../../app/api/tournaments/[id]/comment-counts/route';
import { PlayerCommentRepository } from '@/src/repositories/db/PlayerCommentRepository';
import { createTestUser, createAdminUser, createAuthCookie, createTestGroup, makeRequest } from '../test/helpers';

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

function countsRequest(tournamentId: number, playerIds: number[], groupId?: string, cookie?: string) {
  const qs = new URLSearchParams();
  if (playerIds.length > 0) qs.set('playerIds', playerIds.join(','));
  if (groupId) qs.set('groupId', groupId);
  const url = `/api/tournaments/${tournamentId}/comment-counts?${qs.toString()}`;
  return makeRequest('GET', url, undefined, cookie);
}

let _counter = 880000;
function nextId() { return ++_counter; }

describe('GET /api/tournaments/[id]/comment-counts', () => {
  it('retourne 401 sans cookie', async () => {
    const req = countsRequest(1, [10]);
    const res = await getCommentCounts(req, params('1'));
    expect(res.status).toBe(401);
  });

  it('retourne { counts: {} } si playerIds est absent', async () => {
    const user = await createTestUser({ username: 'cc1', email: 'cc1@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = countsRequest(1, [], undefined, cookie);
    const res = await getCommentCounts(req, params('1'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.counts).toEqual({});
  });

  it('retourne 403 pour un non-membre qui demande la portée groupe', async () => {
    const owner = await createTestUser({ username: 'cc2', email: 'cc2@test.com' });
    const group = await createTestGroup(owner._id);
    const nonMember = await createTestUser({ username: 'cc3', email: 'cc3@test.com' });
    const cookie = await createAuthCookie(nonMember._id, 'USER');

    const req = countsRequest(1, [10], String(group._id), cookie);
    const res = await getCommentCounts(req, params('1'));
    expect(res.status).toBe(403);
  });

  it('retourne 403 pour un non-membre même avec un TournamentExternalAccess en DB (les invités passent par guest_session)', async () => {
    const owner = await createTestUser({ username: 'cc4', email: 'cc4@test.com' });
    const nonMember = await createTestUser({ username: 'cc5', email: 'cc5@test.com' });
    const group = await createTestGroup(owner._id);
    const tid = nextId();

    const cookie = await createAuthCookie(nonMember._id, 'USER');
    const req = countsRequest(tid, [10], String(group._id), cookie);
    const res = await getCommentCounts(req, params(String(tid)));
    expect(res.status).toBe(403);
  });

  it('retourne les counts corrects en portée personnelle', async () => {
    const user = await createTestUser({ username: 'cc6', email: 'cc6@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const userId = String(user._id);
    const tid = nextId();
    const p1 = nextId();
    const p2 = nextId();

    await PlayerCommentRepository.create({ tournamentId: tid, playerId: p1, authorId: userId, groupId: null, inks: ['Amber'], content: 'note 1' });
    await PlayerCommentRepository.create({ tournamentId: tid, playerId: p1, authorId: userId, groupId: null, inks: ['Ruby'], content: 'note 2' });
    await PlayerCommentRepository.create({ tournamentId: tid, playerId: p2, authorId: userId, groupId: null, inks: ['Sapphire'], content: 'note 3' });

    const req = countsRequest(tid, [p1, p2], undefined, cookie);
    const res = await getCommentCounts(req, params(String(tid)));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.counts[p1]).toBe(2);
    expect(data.counts[p2]).toBe(1);
  });

  it('retourne 0 pour les joueurs sans commentaire dans le dict', async () => {
    const user = await createTestUser({ username: 'cc7', email: 'cc7@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const tid = nextId();
    const p1 = nextId();
    const p2 = nextId();

    await PlayerCommentRepository.create({ tournamentId: tid, playerId: p1, authorId: String(user._id), groupId: null, inks: ['Steel'], content: 'note' });

    const req = countsRequest(tid, [p1, p2], undefined, cookie);
    const res = await getCommentCounts(req, params(String(tid)));
    const data = await res.json();
    expect(data.counts[p1]).toBe(1);
    expect(data.counts[p2]).toBeUndefined();
  });

  it('retourne 400 pour un ID de tournoi non numérique', async () => {
    const user = await createTestUser({ username: 'cc-nan', email: 'cc-nan@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', '/api/tournaments/abc/comment-counts?playerIds=1', undefined, cookie);
    const res = await getCommentCounts(req, params('abc'));
    expect(res.status).toBe(400);
  });

  it('un ADMIN peut accéder aux counts d\'un groupe dont il n\'est pas membre', async () => {
    const owner = await createTestUser({ username: 'cc-owner2', email: 'cc-owner2@test.com' });
    const admin = await createAdminUser({ username: 'cc-admin2', email: 'cc-admin2@test.com' });
    const group = await createTestGroup(owner._id);
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const tid = nextId();

    const req = countsRequest(tid, [10], String(group._id), cookie);
    const res = await getCommentCounts(req, params(String(tid)));
    expect(res.status).toBe(200);
  });

  it('retourne les counts en portée groupe pour un membre', async () => {
    const owner = await createTestUser({ username: 'cc8', email: 'cc8@test.com' });
    const group = await createTestGroup(owner._id);
    const cookie = await createAuthCookie(owner._id, 'USER');
    const tid = nextId();
    const p1 = nextId();

    await PlayerCommentRepository.create({ tournamentId: tid, playerId: p1, authorId: String(owner._id), groupId: String(group._id), inks: ['Emerald'], content: 'note groupe' });

    const req = countsRequest(tid, [p1], String(group._id), cookie);
    const res = await getCommentCounts(req, params(String(tid)));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.counts[p1]).toBe(1);
  });
});
