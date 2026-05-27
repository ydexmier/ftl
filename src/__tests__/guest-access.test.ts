import { describe, it, expect } from 'vitest';
import { POST as validateGuest } from '../../app/api/guest/validate/route';
import { POST as inviteExternal } from '../../app/api/groups/[id]/tournaments/[tid]/external-access/route';
import { POST as addTournament } from '../../app/api/groups/[id]/tournaments/route';
import { TournamentExternalAccessRepository } from '@/src/repositories/db/TournamentExternalAccessRepository';
import { ScoutingService } from '@/src/services/ScoutingService';
import { PlayerCommentRepository } from '@/src/repositories/db/PlayerCommentRepository';
import TournamentModel from '@models/Tournament';
import { createTestUser, createAuthCookie, createTestGroup, makeRequest } from '../test/helpers';

let _counter = 0;
async function createTestTournament() {
  _counter++;
  return TournamentModel.create({
    id: 800000 + _counter,
    name: `Guest Tournament ${_counter}`,
    event_status: 'ENDED',
    start_datetime: new Date(),
    store: { id: 1, name: 'Store', address: '' },
    tournament_phases: [],
    gameplay_format: 'standard',
  });
}

function groupParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function tournamentParams(id: string, tid: string) {
  return { params: Promise.resolve({ id, tid }) };
}

function makeGuestRequest(body: unknown) {
  return new Request('http://localhost:3000/api/guest/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof validateGuest>[0];
}

// ─── POST /api/guest/validate ─────────────────────────────────────────────────

describe('POST /api/guest/validate', () => {
  it('retourne 400 si le token est absent', async () => {
    const res = await validateGuest(makeGuestRequest({ displayName: 'Alice' }));
    expect(res.status).toBe(400);
  });

  it('retourne 400 si le displayName est absent', async () => {
    const res = await validateGuest(makeGuestRequest({ token: 'sometoken' }));
    expect(res.status).toBe(400);
  });

  it('retourne 400 si le displayName contient un pipe', async () => {
    const res = await validateGuest(makeGuestRequest({ token: 'sometoken', displayName: 'Ali|ce' }));
    expect(res.status).toBe(400);
  });

  it('retourne 404 si le token est invalide', async () => {
    const res = await validateGuest(makeGuestRequest({ token: 'invalid-token', displayName: 'Alice' }));
    expect(res.status).toBe(404);
  });

  it('accepte un token valide, sauvegarde le displayName et retourne le cookie', async () => {
    const owner = await createTestUser({ username: 'g-owner1', email: 'g-owner1@test.com' });
    const group = await createTestGroup(owner._id);
    const tournament = await createTestTournament();
    const cookie = await createAuthCookie(owner._id, 'USER');

    const addReq = makeRequest('POST', `/api/groups/${group._id}/tournaments`, { tournamentId: tournament.id }, cookie);
    await addTournament(addReq, groupParams(String(group._id)));

    const invReq = makeRequest('POST', `/api/groups/${group._id}/tournaments/${tournament.id}/external-access`, {
      email: 'alice@externe.com',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    }, cookie);
    const invRes = await inviteExternal(invReq, tournamentParams(String(group._id), String(tournament.id)));
    const invData = await invRes.json();

    const res = await validateGuest(makeGuestRequest({ token: invData.accessToken, displayName: 'Alice' }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.tournamentId).toBe(tournament.id);
    expect(data.displayName).toBe('Alice');

    // Cookie posé
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('guest_session=');

    // Statut en DB
    const access = await TournamentExternalAccessRepository.findById(invData._id);
    expect(access?.status).toBe('ACCEPTED');
    expect(access?.displayName).toBe('Alice');
  });

  it('retourne 403 si l\'accès est révoqué', async () => {
    const owner = await createTestUser({ username: 'g-owner2', email: 'g-owner2@test.com' });
    const group = await createTestGroup(owner._id);
    const tournament = await createTestTournament();
    const cookie = await createAuthCookie(owner._id, 'USER');

    const addReq = makeRequest('POST', `/api/groups/${group._id}/tournaments`, { tournamentId: tournament.id }, cookie);
    await addTournament(addReq, groupParams(String(group._id)));

    const invReq = makeRequest('POST', `/api/groups/${group._id}/tournaments/${tournament.id}/external-access`, {
      email: 'bob@externe.com',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    }, cookie);
    const invRes = await inviteExternal(invReq, tournamentParams(String(group._id), String(tournament.id)));
    const invData = await invRes.json();

    await TournamentExternalAccessRepository.revokeAccess(invData._id);

    const res = await validateGuest(makeGuestRequest({ token: invData.accessToken, displayName: 'Bob' }));
    expect(res.status).toBe(403);
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
