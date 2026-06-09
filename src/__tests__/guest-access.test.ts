import { describe, it, expect, beforeEach } from 'vitest';
import { POST as validateGuest } from '../../app/api/guest/validate/route';
import { resetRateLimit } from '@/src/lib/auth/rateLimit';
import { ScoutingService } from '@/src/services/ScoutingService';
import { PlayerCommentRepository } from '@/src/repositories/db/PlayerCommentRepository';
import { GroupMagicLinkRepository } from '@/src/repositories/db/GroupMagicLinkRepository';
import { TournamentExternalAccessRepository } from '@/src/repositories/db/TournamentExternalAccessRepository';
import { createTestUser, createTestGroup } from '../test/helpers';

let _counter = 0;
function nextToken() {
  _counter++;
  return `test-magic-token-${_counter}-${Date.now()}`;
}

function makeGuestRequest(body: unknown, ip?: string) {
  return new Request('http://localhost:3000/api/guest/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(ip ? { 'x-forwarded-for': ip } : {}),
    },
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof validateGuest>[0];
}

// ─── POST /api/guest/validate ─────────────────────────────────────────────────

describe('POST /api/guest/validate', () => {
  beforeEach(() => resetRateLimit('guest-validate:unknown'));

  it('retourne 400 si le token est absent', async () => {
    const res = await validateGuest(makeGuestRequest({ username: 'alice', email: 'alice@test.com', password: 'Password1!abcd' }));
    expect(res.status).toBe(400);
  });

  it('retourne 400 si le username est absent', async () => {
    const res = await validateGuest(makeGuestRequest({ token: 'sometoken', email: 'a@test.com', password: 'Password1!abcd' }));
    expect(res.status).toBe(400);
  });

  it('retourne 400 si le username contient des caractères invalides', async () => {
    const res = await validateGuest(makeGuestRequest({ token: 'sometoken', username: 'ali ce', email: 'a@test.com', password: 'Password1!abcd' }));
    expect(res.status).toBe(400);
  });

  it('retourne 404 si le token est invalide', async () => {
    const res = await validateGuest(makeGuestRequest({ token: 'invalid-token', username: 'alice', email: 'alice@test.com', password: 'Password1!abcd' }));
    expect(res.status).toBe(404);
  });

  it('crée un compte invité, une entrée PENDING et pose le cookie session', async () => {
    const owner = await createTestUser({ username: 'g-owner1', email: 'g-owner1@test.com' });
    const group = await createTestGroup(owner._id);
    const token = nextToken();
    const tournamentId = 900001;

    await GroupMagicLinkRepository.upsert(String(group._id), tournamentId, String(owner._id), token);

    const res = await validateGuest(makeGuestRequest({
      token,
      username: 'guestalice',
      email: 'guestalice@test.com',
      password: 'Password1!abcd',
    }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.tournamentId).toBe(tournamentId);

    // Session cookie posé (compte réel, pas guest_session)
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('session=');
    expect(setCookie).not.toContain('guest_session=');

    // Entrée PENDING en DB pour approbation admin
    const pending = await TournamentExternalAccessRepository.findPendingByGroupAndTournament(
      String(group._id),
      tournamentId,
    );
    expect(pending.length).toBe(1);
    expect(pending[0].status).toBe('PENDING');
  });

  it('retourne 409 si le username est déjà pris', async () => {
    await createTestUser({ username: 'g-taken', email: 'g-taken@test.com' });
    const owner = await createTestUser({ username: 'g-owner2', email: 'g-owner2@test.com' });
    const group = await createTestGroup(owner._id);
    const token = nextToken();
    await GroupMagicLinkRepository.upsert(String(group._id), 900002, String(owner._id), token);

    const res = await validateGuest(makeGuestRequest({
      token,
      username: 'g-taken',
      email: 'newemail@test.com',
      password: 'Password1!abcd',
    }));
    expect(res.status).toBe(409);
  });

  it('retourne 429 après trop de tentatives depuis la même IP', async () => {
    const ip = 'ip-guest-validate-rate-limit';
    let lastStatus = 0;
    for (let i = 0; i < 10; i++) {
      const res = await validateGuest(makeGuestRequest({ token: 'irrelevant' }, ip));
      lastStatus = res.status;
      if (lastStatus === 429) break;
    }
    resetRateLimit(`guest-validate:${ip}`);
    expect(lastStatus).toBe(429);
  });

  it('retourne 409 si l\'email est déjà utilisé', async () => {
    await createTestUser({ username: 'g-email-taken', email: 'taken@test.com' });
    const owner = await createTestUser({ username: 'g-owner3', email: 'g-owner3@test.com' });
    const group = await createTestGroup(owner._id);
    const token = nextToken();
    await GroupMagicLinkRepository.upsert(String(group._id), 900003, String(owner._id), token);

    const res = await validateGuest(makeGuestRequest({
      token,
      username: 'newusername',
      email: 'taken@test.com',
      password: 'Password1!abcd',
    }));
    expect(res.status).toBe(409);
  });
});

// ─── ScoutingService — contrainte authorId/guestAccessId ────────────────────

describe('ScoutingService.assignDecks — reporter union', () => {
  it('lève une erreur si ni userId ni guestAccessId n\'est fourni', async () => {
    await expect(
      ScoutingService.assignDecks(1, 1, [], { groupId: null, userId: null }, {} as never),
    ).rejects.toThrow('INVALID_REPORTER');
  });
});

// ─── PlayerCommentRepository — guest comment ─────────────────────────────────

describe('PlayerCommentRepository.create — guest comment', () => {
  it('crée un commentaire avec guestAccessId et guestDisplayName', async () => {
    const { default: mongoose } = await import('mongoose');
    const fakeAccessId = new mongoose.Types.ObjectId();

    const comment = await PlayerCommentRepository.create({
      tournamentId: 1,
      playerId: 10,
      guestAccessId: String(fakeAccessId),
      guestDisplayName: 'Alice',
      authorId: null,
      groupId: null,
      inks: ['Amber', 'Ruby'],
      content: 'Joue très agressif',
    });

    expect(comment.authorId).toBeNull();
    expect(String(comment.guestAccessId)).toBe(String(fakeAccessId));
    expect(comment.guestDisplayName).toBe('Alice');
    expect(comment.content).toBe('Joue très agressif');
  });

  it('crée un commentaire classique avec authorId', async () => {
    const user = await createTestUser({ username: 'g-author', email: 'g-author@test.com' });

    const comment = await PlayerCommentRepository.create({
      tournamentId: 1,
      playerId: 10,
      authorId: String(user._id),
      groupId: null,
      inks: ['Sapphire'],
      content: 'Note classique',
    });

    // authorId est populé par create() → objet { _id, username }
    const populated = comment.authorId as unknown as { _id: { toString(): string } };
    expect(populated._id.toString()).toBe(String(user._id));
    expect(comment.guestAccessId).toBeNull();
  });
});
