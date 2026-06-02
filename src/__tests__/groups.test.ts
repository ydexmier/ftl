import { describe, it, expect } from 'vitest';
import { GET as listGroups, POST as createGroup } from '../../app/api/groups/route';
import { GET as getGroup, PUT as updateGroup, DELETE as deleteGroup } from '../../app/api/groups/[id]/route';
import GroupModel from '@models/Group';
import { createTestUser, createAuthCookie, createTestGroup, makeRequest } from '../test/helpers';

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('GET /api/groups', () => {
  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('GET', '/api/groups');
    const res = await listGroups(req);
    expect(res.status).toBe(401);
  });

  it('retourne les groupes dont l\'utilisateur est membre', async () => {
    const user = await createTestUser({ username: 'grouplist1', email: 'grouplist1@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    await createTestGroup(user._id, { name: 'my-group-list-1' });
    await createTestGroup(user._id, { name: 'my-group-list-2' });

    const req = makeRequest('GET', '/api/groups', undefined, cookie);
    const res = await listGroups(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data.groups)).toBe(true);
    expect(data.groups.length).toBeGreaterThanOrEqual(2);
  });

  it('retourne un tableau vide si l\'utilisateur n\'a pas de groupe', async () => {
    const user = await createTestUser({ username: 'nogroups', email: 'nogroups@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');

    const req = makeRequest('GET', '/api/groups', undefined, cookie);
    const res = await listGroups(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.groups).toEqual([]);
  });
});

describe('POST /api/groups', () => {
  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('POST', '/api/groups', { name: 'test' });
    const res = await createGroup(req);
    expect(res.status).toBe(401);
  });

  it('retourne 400 si le nom est vide', async () => {
    const user = await createTestUser({ username: 'groupcreate1', email: 'groupcreate1@example.com', canCreateGroup: true });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('POST', '/api/groups', { name: '  ' }, cookie);
    const res = await createGroup(req);
    expect(res.status).toBe(400);
  });

  it('retourne 400 si le nom est déjà pris', async () => {
    const user = await createTestUser({ username: 'groupcreate2', email: 'groupcreate2@example.com', canCreateGroup: true });
    const cookie = await createAuthCookie(user._id, 'USER');
    await createTestGroup(user._id, { name: 'taken-group-name' });
    const req = makeRequest('POST', '/api/groups', { name: 'taken-group-name' }, cookie);
    const res = await createGroup(req);
    expect(res.status).toBe(400);
  });

  it('crée un groupe et retourne 201 avec l\'utilisateur comme admin', async () => {
    const user = await createTestUser({ username: 'groupcreate3', email: 'groupcreate3@example.com', canCreateGroup: true });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('POST', '/api/groups', { name: 'brand-new-group', description: 'desc' }, cookie);
    const res = await createGroup(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.name).toBe('brand-new-group');
    const group = await GroupModel.findOne({ name: 'brand-new-group' });
    expect(group).not.toBeNull();
    expect(group!.members[0].role).toBe('ADMIN');
  });
});

describe('GET /api/groups/[id]', () => {
  it('retourne 401 sans cookie', async () => {
    const user = await createTestUser({ username: 'groupget1', email: 'groupget1@example.com' });
    const group = await createTestGroup(user._id);
    const req = makeRequest('GET', `/api/groups/${group._id}`);
    const res = await getGroup(req, params(String(group._id)));
    expect(res.status).toBe(401);
  });

  it('retourne 404 pour un id inconnu', async () => {
    const user = await createTestUser({ username: 'groupget2', email: 'groupget2@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const fakeId = new (await import('mongoose')).default.Types.ObjectId();
    const req = makeRequest('GET', `/api/groups/${fakeId}`, undefined, cookie);
    const res = await getGroup(req, params(String(fakeId)));
    expect(res.status).toBe(404);
  });

  it('retourne 403 si l\'utilisateur n\'est pas membre', async () => {
    const owner = await createTestUser({ username: 'groupget3', email: 'groupget3@example.com' });
    const outsider = await createTestUser({ username: 'groupget4', email: 'groupget4@example.com' });
    const group = await createTestGroup(owner._id, { name: 'private-group-get' });
    const cookie = await createAuthCookie(outsider._id, 'USER');
    const req = makeRequest('GET', `/api/groups/${group._id}`, undefined, cookie);
    const res = await getGroup(req, params(String(group._id)));
    expect(res.status).toBe(403);
  });

  it('retourne 200 avec les membres enrichis pour un membre', async () => {
    const user = await createTestUser({ username: 'groupget5', email: 'groupget5@example.com' });
    const group = await createTestGroup(user._id, { name: 'visible-group' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', `/api/groups/${group._id}`, undefined, cookie);
    const res = await getGroup(req, params(String(group._id)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.name).toBe('visible-group');
    expect(data.members[0].username).toBe('groupget5');
  });
});

describe('PUT /api/groups/[id]', () => {
  it('retourne 401 sans cookie', async () => {
    const user = await createTestUser({ username: 'groupput1', email: 'groupput1@example.com' });
    const group = await createTestGroup(user._id);
    const req = makeRequest('PUT', `/api/groups/${group._id}`, { name: 'new-name' });
    const res = await updateGroup(req, params(String(group._id)));
    expect(res.status).toBe(401);
  });

  it('retourne 403 si l\'utilisateur n\'est pas admin du groupe', async () => {
    const owner = await createTestUser({ username: 'groupput2', email: 'groupput2@example.com' });
    const member = await createTestUser({ username: 'groupput3', email: 'groupput3@example.com' });
    const group = await createTestGroup(owner._id, { name: 'group-to-update' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: member._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: owner._id } },
    });
    const cookie = await createAuthCookie(member._id, 'USER');
    const req = makeRequest('PUT', `/api/groups/${group._id}`, { name: 'hacked-name' }, cookie);
    const res = await updateGroup(req, params(String(group._id)));
    expect(res.status).toBe(403);
  });

  it('met à jour le nom et retourne 200', async () => {
    const user = await createTestUser({ username: 'groupput4', email: 'groupput4@example.com' });
    const group = await createTestGroup(user._id, { name: 'original-name' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('PUT', `/api/groups/${group._id}`, { name: 'updated-name' }, cookie);
    const res = await updateGroup(req, params(String(group._id)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.name).toBe('updated-name');
  });
});

describe('DELETE /api/groups/[id]', () => {
  it('retourne 401 sans cookie', async () => {
    const user = await createTestUser({ username: 'groupdel1', email: 'groupdel1@example.com' });
    const group = await createTestGroup(user._id);
    const req = makeRequest('DELETE', `/api/groups/${group._id}`);
    const res = await deleteGroup(req, params(String(group._id)));
    expect(res.status).toBe(401);
  });

  it('retourne 403 si l\'utilisateur n\'est pas admin', async () => {
    const owner = await createTestUser({ username: 'groupdel2', email: 'groupdel2@example.com' });
    const member = await createTestUser({ username: 'groupdel3', email: 'groupdel3@example.com' });
    const group = await createTestGroup(owner._id, { name: 'group-no-del' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: member._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: owner._id } },
    });
    const cookie = await createAuthCookie(member._id, 'USER');
    const req = makeRequest('DELETE', `/api/groups/${group._id}`, undefined, cookie);
    const res = await deleteGroup(req, params(String(group._id)));
    expect(res.status).toBe(403);
  });

  it('supprime le groupe et retourne 200', async () => {
    const user = await createTestUser({ username: 'groupdel4', email: 'groupdel4@example.com' });
    const group = await createTestGroup(user._id, { name: 'group-to-delete' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('DELETE', `/api/groups/${group._id}`, undefined, cookie);
    const res = await deleteGroup(req, params(String(group._id)));

    expect(res.status).toBe(200);
    const deleted = await GroupModel.findById(group._id);
    expect(deleted).toBeNull();
  });
});
