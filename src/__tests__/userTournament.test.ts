import { describe, it, expect, beforeEach } from 'vitest';
import { GET as searchTournaments } from '../../app/api/tournaments/search/route';
import { POST as linkTournament } from '../../app/api/tournaments/[id]/link/route';
import TournamentModel from '@models/Tournament';
import UserTournamentModel from '@models/UserTournament';
import GroupTournamentModel from '@models/GroupTournament';
import { makeRequest, createTestUser, createAuthCookie, createTestGroup } from '../test/helpers';

let _counter = 0;
function nextId() { return 900000 + ++_counter; }

async function seedTournament(id?: number) {
  const tid = id ?? nextId();
  return TournamentModel.create({
    id: tid,
    name: `Tournament ${tid}`,
    event_status: 'NOT_STARTED',
    start_datetime: new Date(),
    registered_user_count: 0,
  });
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(async () => {
  await TournamentModel.deleteMany({});
  await UserTournamentModel.deleteMany({});
  await GroupTournamentModel.deleteMany({});
});

describe('GET /api/tournaments/search', () => {
  it('retourne 401 sans session', async () => {
    const req = makeRequest('GET', '/api/tournaments/search?q=test');
    const res = await searchTournaments(req);
    expect(res.status).toBe(401);
  });

  it('retourne 400 si query vide', async () => {
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', '/api/tournaments/search?q=', undefined, cookie);
    const res = await searchTournaments(req);
    expect(res.status).toBe(400);
  });

  it('retourne les tournois correspondant au nom', async () => {
    await seedTournament();
    const tid = nextId();
    await TournamentModel.create({ id: tid, name: 'Lorcana Paris Open', event_status: 'NOT_STARTED', start_datetime: new Date(), registered_user_count: 0 });
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', '/api/tournaments/search?q=Paris', undefined, cookie);
    const res = await searchTournaments(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results).toHaveLength(1);
    expect(body.results[0].name).toBe('Lorcana Paris Open');
    expect(body.noResults).toBe(false);
  });

  it('retourne le tournoi par ID numérique', async () => {
    const t = await seedTournament();
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', `/api/tournaments/search?q=${t.id}`, undefined, cookie);
    const res = await searchTournaments(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results).toHaveLength(1);
    expect(body.results[0].id).toBe(t.id);
  });

  it('retourne noResults=true et fetchableId quand aucun résultat pour un ID', async () => {
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', '/api/tournaments/search?q=999888777', undefined, cookie);
    const res = await searchTournaments(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.noResults).toBe(true);
    expect(body.fetchableId).toBe(999888777);
  });

  it('retourne noResults=true et fetchableId=null pour un nom sans résultat', async () => {
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', '/api/tournaments/search?q=inexistant', undefined, cookie);
    const res = await searchTournaments(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.noResults).toBe(true);
    expect(body.fetchableId).toBeNull();
  });

  it('marque isLinked=true si le user a déjà lié le tournoi', async () => {
    const t = await seedTournament();
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    await UserTournamentModel.create({ userId: user._id, tournamentId: t.id, status: 'ACTIVE' });
    const req = makeRequest('GET', `/api/tournaments/search?q=${t.id}`, undefined, cookie);
    const res = await searchTournaments(req);
    const body = await res.json();
    expect(body.results[0].isLinked).toBe(true);
  });

  it('marque isGroupTournament=true si le tournoi est dans un groupe du user', async () => {
    const t = await seedTournament();
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    const group = await createTestGroup(user._id);
    await GroupTournamentModel.create({ groupId: group._id, tournamentId: t.id, addedBy: user._id });
    const req = makeRequest('GET', `/api/tournaments/search?q=${t.id}`, undefined, cookie);
    const res = await searchTournaments(req);
    const body = await res.json();
    expect(body.results[0].isGroupTournament).toBe(true);
  });
});

describe('POST /api/tournaments/[id]/link', () => {
  it('retourne 401 sans session', async () => {
    const t = await seedTournament();
    const req = makeRequest('POST', `/api/tournaments/${t.id}/link`);
    const res = await linkTournament(req, params(String(t.id)));
    expect(res.status).toBe(401);
  });

  it('retourne 404 si le tournoi n\'existe pas en BDD', async () => {
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('POST', '/api/tournaments/999999/link', undefined, cookie);
    const res = await linkTournament(req, params('999999'));
    expect(res.status).toBe(404);
  });

  it('lie un tournoi au user avec succès', async () => {
    const t = await seedTournament();
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('POST', `/api/tournaments/${t.id}/link`, undefined, cookie);
    const res = await linkTournament(req, params(String(t.id)));
    expect(res.status).toBe(201);
    const link = await UserTournamentModel.findOne({ userId: user._id, tournamentId: t.id });
    expect(link).not.toBeNull();
    expect(link!.status).toBe('ACTIVE');
  });

  it('retourne 409 si le tournoi est déjà lié', async () => {
    const t = await seedTournament();
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    await UserTournamentModel.create({ userId: user._id, tournamentId: t.id, status: 'ACTIVE' });
    const req = makeRequest('POST', `/api/tournaments/${t.id}/link`, undefined, cookie);
    const res = await linkTournament(req, params(String(t.id)));
    expect(res.status).toBe(409);
  });

  it('retourne 409 si le tournoi est dans un groupe du user', async () => {
    const t = await seedTournament();
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    const group = await createTestGroup(user._id);
    await GroupTournamentModel.create({ groupId: group._id, tournamentId: t.id, addedBy: user._id });
    const req = makeRequest('POST', `/api/tournaments/${t.id}/link`, undefined, cookie);
    const res = await linkTournament(req, params(String(t.id)));
    expect(res.status).toBe(409);
  });

  it('retourne 400 pour un ID invalide', async () => {
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('POST', '/api/tournaments/abc/link', undefined, cookie);
    const res = await linkTournament(req, params('abc'));
    expect(res.status).toBe(400);
  });
});
