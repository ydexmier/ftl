import { describe, it, expect } from 'vitest';
import {
  GET as groupGetTokens,
  POST as groupCreateToken,
} from '../../app/api/groups/[id]/tournaments/[tid]/api-tokens/route';
import { DELETE as groupRevokeToken } from '../../app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route';
import {
  GET as userGetTokens,
  POST as userCreateToken,
} from '../../app/api/user/tournaments/[id]/api-tokens/route';
import { DELETE as userRevokeToken } from '../../app/api/user/tournaments/[id]/api-tokens/[tokenId]/route';
import { GET as externalGetPlayers } from '../../app/api/external/tournaments/[id]/players/route';
import ApiTokenModel from '@models/ApiToken';
import TournamentPlayersDeckModel from '@models/TournamentPlayersDeck';
import { createTestUser, createTestGroup, createAuthCookie, makeRequest } from '../test/helpers';

function groupParams(id: string, tid: string) {
  return { params: Promise.resolve({ id, tid }) };
}
function groupTokenParams(id: string, tid: string, tokenId: string) {
  return { params: Promise.resolve({ id, tid, tokenId }) };
}
function idParam(id: string) {
  return { params: Promise.resolve({ id }) };
}
function idTokenParam(id: string, tokenId: string) {
  return { params: Promise.resolve({ id, tokenId }) };
}

function makeBearer(token: string) {
  return new Request('http://localhost:3000/api/external/tournaments/1/players', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ─── Group token management ───────────────────────────────────────────────────

describe('GET /api/groups/[id]/tournaments/[tid]/api-tokens', () => {
  it('retourne 401 sans session', async () => {
    const req = makeRequest('GET', '/api/groups/g1/tournaments/1/api-tokens');
    const res = await groupGetTokens(req, groupParams('g1', '1'));
    expect(res.status).toBe(401);
  });

  it('retourne 403 si pas admin du groupe', async () => {
    const member = await createTestUser({ username: 'member1', email: 'member1@test.com' });
    const admin = await createTestUser({ username: 'admin1', email: 'admin1@test.com' });
    const group = await createTestGroup(String(admin._id));
    const cookie = await createAuthCookie(member._id, 'USER');
    const req = makeRequest('GET', '/api/groups/g/tournaments/1/api-tokens', undefined, cookie);
    const res = await groupGetTokens(req, groupParams(String(group._id), '1'));
    expect(res.status).toBe(403);
  });

  it('retourne la liste des tokens pour un admin', async () => {
    const admin = await createTestUser({ username: 'admin2', email: 'admin2@test.com' });
    const group = await createTestGroup(String(admin._id));
    const cookie = await createAuthCookie(admin._id, 'USER');
    const req = makeRequest('GET', '/api/groups/g/tournaments/1/api-tokens', undefined, cookie);
    const res = await groupGetTokens(req, groupParams(String(group._id), '1'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

describe('POST /api/groups/[id]/tournaments/[tid]/api-tokens', () => {
  it('retourne 400 si nom manquant', async () => {
    const admin = await createTestUser({ username: 'admin3', email: 'admin3@test.com' });
    const group = await createTestGroup(String(admin._id));
    const cookie = await createAuthCookie(admin._id, 'USER');
    const req = makeRequest('POST', '/api/groups/g/tournaments/1/api-tokens', { name: '' }, cookie);
    const res = await groupCreateToken(req, groupParams(String(group._id), '1'));
    expect(res.status).toBe(400);
  });

  it('crée un token et retourne le rawToken une seule fois', async () => {
    const admin = await createTestUser({ username: 'admin4', email: 'admin4@test.com' });
    const group = await createTestGroup(String(admin._id));
    const cookie = await createAuthCookie(admin._id, 'USER');
    const req = makeRequest('POST', '/api/groups/g/tournaments/1/api-tokens', { name: 'Bot Discord' }, cookie);
    const res = await groupCreateToken(req, groupParams(String(group._id), '1'));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.rawToken).toBeDefined();
    expect(data.rawToken).toHaveLength(64);
    expect(data.token.name).toBe('Bot Discord');
    expect(data.token.status).toBe('ACTIVE');
    // Le token brut n'est pas en DB (seul le hash l'est)
    const inDb = await ApiTokenModel.findOne({ token: data.rawToken });
    expect(inDb).toBeNull();
  });
});

describe('DELETE /api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]', () => {
  it('révoque un token existant', async () => {
    const admin = await createTestUser({ username: 'admin5', email: 'admin5@test.com' });
    const group = await createTestGroup(String(admin._id));
    const cookie = await createAuthCookie(admin._id, 'USER');

    // Créer un token
    const createReq = makeRequest('POST', '/t', { name: 'Révocable' }, cookie);
    const createRes = await groupCreateToken(createReq, groupParams(String(group._id), '1'));
    const { token } = await createRes.json();

    // Le révoquer
    const delReq = makeRequest('DELETE', '/t', undefined, cookie);
    const delRes = await groupRevokeToken(delReq, groupTokenParams(String(group._id), '1', String(token._id)));
    expect(delRes.status).toBe(200);

    const inDb = await ApiTokenModel.findById(token._id);
    expect(inDb?.status).toBe('REVOKED');
  });
});

// ─── User token management ────────────────────────────────────────────────────

describe('POST /api/user/tournaments/[id]/api-tokens', () => {
  it('crée un token utilisateur', async () => {
    const user = await createTestUser({ username: 'user1', email: 'user1@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('POST', '/api/user/tournaments/1/api-tokens', { name: 'Mon Bot' }, cookie);
    const res = await userCreateToken(req, idParam('1'));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.rawToken).toHaveLength(64);
    expect(data.token.name).toBe('Mon Bot');
  });
});

describe('DELETE /api/user/tournaments/[id]/api-tokens/[tokenId]', () => {
  it('ne peut pas révoquer le token d\'un autre utilisateur', async () => {
    const owner = await createTestUser({ username: 'owner1', email: 'owner1@test.com' });
    const other = await createTestUser({ username: 'other1', email: 'other1@test.com' });
    const ownerCookie = await createAuthCookie(owner._id, 'USER');
    const otherCookie = await createAuthCookie(other._id, 'USER');

    // Owner crée un token
    const createReq = makeRequest('POST', '/t', { name: 'Token Owner' }, ownerCookie);
    const createRes = await userCreateToken(createReq, idParam('1'));
    const { token } = await createRes.json();

    // Other essaie de le révoquer
    const delReq = makeRequest('DELETE', '/t', undefined, otherCookie);
    const delRes = await userRevokeToken(delReq, idTokenParam('1', String(token._id)));
    expect(delRes.status).toBe(404);
  });
});

// ─── External endpoint ────────────────────────────────────────────────────────

describe('GET /api/external/tournaments/[id]/players', () => {
  it('retourne 401 sans Authorization header', async () => {
    const req = new Request('http://localhost:3000/api/external/tournaments/1/players');
    const res = await externalGetPlayers(req as never, idParam('1'));
    expect(res.status).toBe(401);
  });

  it('retourne 401 avec un token invalide', async () => {
    const req = makeBearer('tokenfaketokeninvalide0000000000000000000000000000000000000000000');
    const res = await externalGetPlayers(req as never, idParam('1'));
    expect(res.status).toBe(401);
  });

  it('retourne 401 avec un token expiré', async () => {
    const admin = await createTestUser({ username: 'admin6', email: 'admin6@test.com' });
    const group = await createTestGroup(String(admin._id));
    const cookie = await createAuthCookie(admin._id, 'USER');

    const createReq = makeRequest('POST', '/t', { name: 'Expiré' }, cookie);
    const createRes = await groupCreateToken(createReq, groupParams(String(group._id), '1'));
    const { rawToken, token } = await createRes.json();

    // Forcer l'expiration
    await ApiTokenModel.findByIdAndUpdate(token._id, { expiresAt: new Date(Date.now() - 1000) });

    const req = makeBearer(rawToken);
    const res = await externalGetPlayers(req as never, idParam('1'));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/expir/i);
  });

  it('retourne 403 si le token ne correspond pas au tournoi demandé', async () => {
    const admin = await createTestUser({ username: 'admin7', email: 'admin7@test.com' });
    const group = await createTestGroup(String(admin._id));
    const cookie = await createAuthCookie(admin._id, 'USER');

    // Token créé pour tournoi 1
    const createReq = makeRequest('POST', '/t', { name: 'Mauvais tournoi' }, cookie);
    const createRes = await groupCreateToken(createReq, groupParams(String(group._id), '1'));
    const { rawToken } = await createRes.json();

    // Mais on interroge le tournoi 2
    const req = makeBearer(rawToken);
    const res = await externalGetPlayers(req as never, idParam('2'));
    expect(res.status).toBe(403);
  });

  it('retourne les joueurs pour un token valide', async () => {
    const admin = await createTestUser({ username: 'admin8', email: 'admin8@test.com' });
    const group = await createTestGroup(String(admin._id));
    const cookie = await createAuthCookie(admin._id, 'USER');

    // Insérer un document de decks pour ce groupe/tournoi
    await TournamentPlayersDeckModel.create({
      tournamentId: 42,
      groupId: group._id,
      userId: null,
      players: [
        { playerId: 1, best_identifier: 'Alice', pronouns: null, event_best_identifier: 'Alice#1', decks: [['Amber', 'Sapphire']] },
        { playerId: 2, best_identifier: 'Bob', pronouns: null, event_best_identifier: 'Bob#2', decks: [] },
      ],
    });

    // Créer un token pour ce tournoi/groupe
    const createReq = makeRequest('POST', '/t', { name: 'Lecteur' }, cookie);
    const createRes = await groupCreateToken(createReq, groupParams(String(group._id), '42'));
    const { rawToken } = await createRes.json();

    const req = makeBearer(rawToken);
    const res = await externalGetPlayers(req as never, idParam('42'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.tournamentId).toBe(42);
    expect(data.scopeType).toBe('group');
    expect(data.players).toHaveLength(2);
    expect(data.players[0].id).toBe(1);
    expect(data.players[0].decks).toEqual([['Amber', 'Sapphire']]);
    expect(Array.isArray(data.players[0].comments)).toBe(true);
  });
});
