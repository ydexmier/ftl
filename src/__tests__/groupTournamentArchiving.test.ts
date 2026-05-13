import { describe, it, expect, beforeEach } from 'vitest';
import { PATCH as patchGroupTournament, DELETE as deleteGroupTournament } from '../../app/api/groups/[id]/tournaments/[tid]/route';
import TournamentModel from '@models/Tournament';
import GroupTournamentModel from '@models/GroupTournament';
import { makeRequest, createTestUser, createAuthCookie, createTestGroup } from '../test/helpers';

let _counter = 0;
function nextId() { return 920000 + ++_counter; }

async function seedTournament(id?: number) {
  const tid = id ?? nextId();
  return TournamentModel.create({ id: tid, name: `Tournament ${tid}`, event_status: 'NOT_STARTED', start_datetime: new Date(), registered_user_count: 0 });
}

function params(id: string, tid: string) {
  return { params: Promise.resolve({ id, tid }) };
}

beforeEach(async () => {
  await TournamentModel.deleteMany({});
  await GroupTournamentModel.deleteMany({});
});

describe('PATCH /api/groups/[id]/tournaments/[tid]', () => {
  it('retourne 401 sans session', async () => {
    const req = makeRequest('PATCH', '/api/groups/g1/tournaments/1', { status: 'ARCHIVED' });
    const res = await patchGroupTournament(req, params('g1', '1'));
    expect(res.status).toBe(401);
  });

  it('retourne 403 si le user n\'est pas admin du groupe', async () => {
    const admin = await createTestUser({ username: 'admin', email: 'admin@test.com' });
    const member = await createTestUser({ username: 'member', email: 'member@test.com' });
    const cookieMember = await createAuthCookie(member._id, 'USER');
    const group = await createTestGroup(admin._id);
    const t = await seedTournament();
    await GroupTournamentModel.create({ groupId: group._id, tournamentId: t.id, addedBy: admin._id, status: 'ACTIVE' });

    const req = makeRequest('PATCH', `/api/groups/${group._id}/tournaments/${t.id}`, { status: 'ARCHIVED' }, cookieMember);
    const res = await patchGroupTournament(req, params(String(group._id), String(t.id)));
    expect(res.status).toBe(403);
  });

  it('retourne 400 si le tournoi n\'est pas dans le groupe', async () => {
    const admin = await createTestUser({ username: 'admin2', email: 'admin2@test.com' });
    const cookie = await createAuthCookie(admin._id, 'USER');
    const group = await createTestGroup(admin._id);
    const t = await seedTournament();

    const req = makeRequest('PATCH', `/api/groups/${group._id}/tournaments/${t.id}`, { status: 'ARCHIVED' }, cookie);
    const res = await patchGroupTournament(req, params(String(group._id), String(t.id)));
    expect(res.status).toBe(400);
  });

  it('retourne 400 pour un statut invalide', async () => {
    const admin = await createTestUser({ username: 'admin3', email: 'admin3@test.com' });
    const cookie = await createAuthCookie(admin._id, 'USER');
    const group = await createTestGroup(admin._id);
    const t = await seedTournament();
    await GroupTournamentModel.create({ groupId: group._id, tournamentId: t.id, addedBy: admin._id, status: 'ACTIVE' });

    const req = makeRequest('PATCH', `/api/groups/${group._id}/tournaments/${t.id}`, { status: 'INVALID' }, cookie);
    const res = await patchGroupTournament(req, params(String(group._id), String(t.id)));
    expect(res.status).toBe(400);
  });

  it('archive un tournoi de groupe (admin)', async () => {
    const admin = await createTestUser({ username: 'admin4', email: 'admin4@test.com' });
    const cookie = await createAuthCookie(admin._id, 'USER');
    const group = await createTestGroup(admin._id);
    const t = await seedTournament();
    await GroupTournamentModel.create({ groupId: group._id, tournamentId: t.id, addedBy: admin._id, status: 'ACTIVE' });

    const req = makeRequest('PATCH', `/api/groups/${group._id}/tournaments/${t.id}`, { status: 'ARCHIVED' }, cookie);
    const res = await patchGroupTournament(req, params(String(group._id), String(t.id)));
    expect(res.status).toBe(200);
    const gt = await GroupTournamentModel.findOne({ groupId: group._id, tournamentId: t.id });
    expect(gt!.status).toBe('ARCHIVED');
  });

  it('restaure un tournoi de groupe archivé (admin)', async () => {
    const admin = await createTestUser({ username: 'admin5', email: 'admin5@test.com' });
    const cookie = await createAuthCookie(admin._id, 'USER');
    const group = await createTestGroup(admin._id);
    const t = await seedTournament();
    await GroupTournamentModel.create({ groupId: group._id, tournamentId: t.id, addedBy: admin._id, status: 'ARCHIVED' });

    const req = makeRequest('PATCH', `/api/groups/${group._id}/tournaments/${t.id}`, { status: 'ACTIVE' }, cookie);
    const res = await patchGroupTournament(req, params(String(group._id), String(t.id)));
    expect(res.status).toBe(200);
    const gt = await GroupTournamentModel.findOne({ groupId: group._id, tournamentId: t.id });
    expect(gt!.status).toBe('ACTIVE');
  });

  it('DELETE reste fonctionnel', async () => {
    const admin = await createTestUser({ username: 'admin6', email: 'admin6@test.com' });
    const cookie = await createAuthCookie(admin._id, 'USER');
    const group = await createTestGroup(admin._id);
    const t = await seedTournament();
    await GroupTournamentModel.create({ groupId: group._id, tournamentId: t.id, addedBy: admin._id, status: 'ACTIVE' });

    const req = makeRequest('DELETE', `/api/groups/${group._id}/tournaments/${t.id}`, undefined, cookie);
    const res = await deleteGroupTournament(req, params(String(group._id), String(t.id)));
    expect(res.status).toBe(200);
    const gt = await GroupTournamentModel.findOne({ groupId: group._id, tournamentId: t.id });
    expect(gt).toBeNull();
  });
});
