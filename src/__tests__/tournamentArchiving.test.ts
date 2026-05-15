import { describe, it, expect, beforeEach } from 'vitest';
import { PATCH as patchUserTournament } from '../../app/api/user/tournaments/[id]/route';
import TournamentModel from '@models/Tournament';
import UserTournamentModel from '@models/UserTournament';
import { makeRequest, createTestUser, createAuthCookie } from '../test/helpers';

let _counter = 0;
function nextId() { return 910000 + ++_counter; }

async function seedTournament(id?: number) {
  const tid = id ?? nextId();
  return TournamentModel.create({ id: tid, name: `Tournament ${tid}`, event_status: 'NOT_STARTED', start_datetime: new Date(), registered_user_count: 0 });
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(async () => {
  await TournamentModel.deleteMany({});
  await UserTournamentModel.deleteMany({});
});

describe('PATCH /api/user/tournaments/[id]', () => {
  it('retourne 401 sans session', async () => {
    const req = makeRequest('PATCH', '/api/user/tournaments/1', { status: 'ARCHIVED' });
    const res = await patchUserTournament(req, params('1'));
    expect(res.status).toBe(401);
  });

  it('retourne 400 pour un ID invalide', async () => {
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('PATCH', '/api/user/tournaments/abc', { status: 'ARCHIVED' }, cookie);
    const res = await patchUserTournament(req, params('abc'));
    expect(res.status).toBe(400);
  });

  it('retourne 400 pour un statut invalide', async () => {
    const t = await seedTournament();
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    await UserTournamentModel.create({ userId: user._id, tournamentId: t.id, status: 'ACTIVE' });
    const req = makeRequest('PATCH', `/api/user/tournaments/${t.id}`, { status: 'INVALID' }, cookie);
    const res = await patchUserTournament(req, params(String(t.id)));
    expect(res.status).toBe(400);
  });

  it('retourne 404 si le tournoi n\'est pas lié au user', async () => {
    const t = await seedTournament();
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('PATCH', `/api/user/tournaments/${t.id}`, { status: 'ARCHIVED' }, cookie);
    const res = await patchUserTournament(req, params(String(t.id)));
    expect(res.status).toBe(404);
  });

  it('archive un tournoi lié', async () => {
    const t = await seedTournament();
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    await UserTournamentModel.create({ userId: user._id, tournamentId: t.id, status: 'ACTIVE' });
    const req = makeRequest('PATCH', `/api/user/tournaments/${t.id}`, { status: 'ARCHIVED' }, cookie);
    const res = await patchUserTournament(req, params(String(t.id)));
    expect(res.status).toBe(200);
    const link = await UserTournamentModel.findOne({ userId: user._id, tournamentId: t.id });
    expect(link!.status).toBe('ARCHIVED');
  });

  it('restaure un tournoi archivé', async () => {
    const t = await seedTournament();
    const user = await createTestUser();
    const cookie = await createAuthCookie(user._id, 'USER');
    await UserTournamentModel.create({ userId: user._id, tournamentId: t.id, status: 'ARCHIVED' });
    const req = makeRequest('PATCH', `/api/user/tournaments/${t.id}`, { status: 'ACTIVE' }, cookie);
    const res = await patchUserTournament(req, params(String(t.id)));
    expect(res.status).toBe(200);
    const link = await UserTournamentModel.findOne({ userId: user._id, tournamentId: t.id });
    expect(link!.status).toBe('ACTIVE');
  });

  it('n\'affecte pas les tournois d\'un autre user', async () => {
    const t = await seedTournament();
    const userA = await createTestUser({ username: 'userA', email: 'a@test.com' });
    const userB = await createTestUser({ username: 'userB', email: 'b@test.com' });
    const cookieB = await createAuthCookie(userB._id, 'USER');
    await UserTournamentModel.create({ userId: userA._id, tournamentId: t.id, status: 'ACTIVE' });
    const req = makeRequest('PATCH', `/api/user/tournaments/${t.id}`, { status: 'ARCHIVED' }, cookieB);
    const res = await patchUserTournament(req, params(String(t.id)));
    expect(res.status).toBe(404);
    const link = await UserTournamentModel.findOne({ userId: userA._id, tournamentId: t.id });
    expect(link!.status).toBe('ACTIVE');
  });
});
