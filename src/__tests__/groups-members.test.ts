import { describe, it, expect } from 'vitest';
import { POST as inviteMember } from '../../app/api/groups/[id]/members/route';
import { DELETE as removeMember, PUT as updateMemberRole } from '../../app/api/groups/[id]/members/[userId]/route';
import GroupModel from '@models/Group';
import { createTestUser, createAuthCookie, createTestGroup, makeRequest } from '../test/helpers';

function params(id: string, userId?: string) {
  return { params: Promise.resolve({ id, userId: userId ?? '' }) };
}

describe('POST /api/groups/[id]/members (invite)', () => {
  it('retourne 401 sans cookie', async () => {
    const owner = await createTestUser({ username: 'meminv1', email: 'meminv1@example.com' });
    const group = await createTestGroup(owner._id);
    const req = makeRequest('POST', `/api/groups/${group._id}/members`, { userId: String(owner._id) });
    const res = await inviteMember(req, params(String(group._id)));
    expect(res.status).toBe(401);
  });

  it('retourne 403 si l\'appelant n\'est pas admin du groupe', async () => {
    const owner = await createTestUser({ username: 'meminv2', email: 'meminv2@example.com' });
    const member = await createTestUser({ username: 'meminv3', email: 'meminv3@example.com' });
    const outsider = await createTestUser({ username: 'meminv4', email: 'meminv4@example.com' });
    const group = await createTestGroup(owner._id, { name: 'inv-group-1' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: member._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: owner._id } },
    });
    const cookie = await createAuthCookie(member._id, 'USER');
    const req = makeRequest('POST', `/api/groups/${group._id}/members`, { userId: String(outsider._id) }, cookie);
    const res = await inviteMember(req, params(String(group._id)));
    expect(res.status).toBe(403);
  });

  it('retourne 400 si l\'utilisateur est déjà membre', async () => {
    const owner = await createTestUser({ username: 'meminv5', email: 'meminv5@example.com' });
    const existing = await createTestUser({ username: 'meminv6', email: 'meminv6@example.com' });
    const group = await createTestGroup(owner._id, { name: 'inv-group-2' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: existing._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: owner._id } },
    });
    const cookie = await createAuthCookie(owner._id, 'USER');
    const req = makeRequest('POST', `/api/groups/${group._id}/members`, { userId: String(existing._id) }, cookie);
    const res = await inviteMember(req, params(String(group._id)));
    expect(res.status).toBe(400);
  });

  it('retourne 400 si l\'utilisateur invité n\'existe pas', async () => {
    const owner = await createTestUser({ username: 'meminv7', email: 'meminv7@example.com' });
    const group = await createTestGroup(owner._id, { name: 'inv-group-3' });
    const fakeId = new (await import('mongoose')).default.Types.ObjectId();
    const cookie = await createAuthCookie(owner._id, 'USER');
    const req = makeRequest('POST', `/api/groups/${group._id}/members`, { userId: String(fakeId) }, cookie);
    const res = await inviteMember(req, params(String(group._id)));
    expect(res.status).toBe(400);
  });

  it('crée une invitation et retourne 201', async () => {
    const owner = await createTestUser({ username: 'meminv8', email: 'meminv8@example.com' });
    const target = await createTestUser({ username: 'meminv9', email: 'meminv9@example.com' });
    const group = await createTestGroup(owner._id, { name: 'inv-group-4' });
    const cookie = await createAuthCookie(owner._id, 'USER');
    const req = makeRequest('POST', `/api/groups/${group._id}/members`, { userId: String(target._id) }, cookie);
    const res = await inviteMember(req, params(String(group._id)));

    expect(res.status).toBe(201);
  });
});

describe('DELETE /api/groups/[id]/members/[userId]', () => {
  it('retourne 401 sans cookie', async () => {
    const owner = await createTestUser({ username: 'memdel1', email: 'memdel1@example.com' });
    const member = await createTestUser({ username: 'memdel2', email: 'memdel2@example.com' });
    const group = await createTestGroup(owner._id, { name: 'del-group-1' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: member._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: owner._id } },
    });
    const req = makeRequest('DELETE', `/api/groups/${group._id}/members/${member._id}`);
    const res = await removeMember(req, params(String(group._id), String(member._id)));
    expect(res.status).toBe(401);
  });

  it('retourne 403 si l\'appelant n\'est pas admin et ne se retire pas lui-même', async () => {
    const owner = await createTestUser({ username: 'memdel3', email: 'memdel3@example.com' });
    const member1 = await createTestUser({ username: 'memdel4', email: 'memdel4@example.com' });
    const member2 = await createTestUser({ username: 'memdel5', email: 'memdel5@example.com' });
    const group = await createTestGroup(owner._id, { name: 'del-group-2' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: {
        members: [
          { userId: member1._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: owner._id },
          { userId: member2._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: owner._id },
        ],
      },
    });
    const cookie = await createAuthCookie(member1._id, 'USER');
    const req = makeRequest('DELETE', `/api/groups/${group._id}/members/${member2._id}`, undefined, cookie);
    const res = await removeMember(req, params(String(group._id), String(member2._id)));
    expect(res.status).toBe(403);
  });

  it('retourne 400 si l\'on tente de retirer le seul admin', async () => {
    const owner = await createTestUser({ username: 'memdel6', email: 'memdel6@example.com' });
    const group = await createTestGroup(owner._id, { name: 'del-group-3' });
    const cookie = await createAuthCookie(owner._id, 'USER');
    const req = makeRequest('DELETE', `/api/groups/${group._id}/members/${owner._id}`, undefined, cookie);
    const res = await removeMember(req, params(String(group._id), String(owner._id)));
    expect(res.status).toBe(400);
  });

  it('retire un membre et retourne 200', async () => {
    const owner = await createTestUser({ username: 'memdel7', email: 'memdel7@example.com' });
    const member = await createTestUser({ username: 'memdel8', email: 'memdel8@example.com' });
    const group = await createTestGroup(owner._id, { name: 'del-group-4' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: member._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: owner._id } },
    });
    const cookie = await createAuthCookie(owner._id, 'USER');
    const req = makeRequest('DELETE', `/api/groups/${group._id}/members/${member._id}`, undefined, cookie);
    const res = await removeMember(req, params(String(group._id), String(member._id)));

    expect(res.status).toBe(200);
    const updated = await GroupModel.findById(group._id);
    expect(updated!.members.some((m) => String(m.userId) === String(member._id))).toBe(false);
  });

  it('un membre peut se retirer lui-même', async () => {
    const owner = await createTestUser({ username: 'memdel9', email: 'memdel9@example.com' });
    const member = await createTestUser({ username: 'memdel10', email: 'memdel10@example.com' });
    const group = await createTestGroup(owner._id, { name: 'del-group-5' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: member._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: owner._id } },
    });
    const cookie = await createAuthCookie(member._id, 'USER');
    const req = makeRequest('DELETE', `/api/groups/${group._id}/members/${member._id}`, undefined, cookie);
    const res = await removeMember(req, params(String(group._id), String(member._id)));
    expect(res.status).toBe(200);
  });
});

describe('PUT /api/groups/[id]/members/[userId] (update role)', () => {
  it('retourne 401 sans cookie', async () => {
    const owner = await createTestUser({ username: 'memrole1', email: 'memrole1@example.com' });
    const member = await createTestUser({ username: 'memrole2', email: 'memrole2@example.com' });
    const group = await createTestGroup(owner._id, { name: 'role-group-1' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: member._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: owner._id } },
    });
    const req = makeRequest('PUT', `/api/groups/${group._id}/members/${member._id}`, { role: 'ADMIN' });
    const res = await updateMemberRole(req, params(String(group._id), String(member._id)));
    expect(res.status).toBe(401);
  });

  it('retourne 403 si l\'appelant n\'est pas admin', async () => {
    const owner = await createTestUser({ username: 'memrole3', email: 'memrole3@example.com' });
    const member = await createTestUser({ username: 'memrole4', email: 'memrole4@example.com' });
    const group = await createTestGroup(owner._id, { name: 'role-group-2' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: member._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: owner._id } },
    });
    const cookie = await createAuthCookie(member._id, 'USER');
    const req = makeRequest('PUT', `/api/groups/${group._id}/members/${member._id}`, { role: 'ADMIN' }, cookie);
    const res = await updateMemberRole(req, params(String(group._id), String(member._id)));
    expect(res.status).toBe(403);
  });

  it('retourne 400 pour un rôle invalide', async () => {
    const owner = await createTestUser({ username: 'memrole5', email: 'memrole5@example.com' });
    const member = await createTestUser({ username: 'memrole6', email: 'memrole6@example.com' });
    const group = await createTestGroup(owner._id, { name: 'role-group-3' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: member._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: owner._id } },
    });
    const cookie = await createAuthCookie(owner._id, 'USER');
    const req = makeRequest('PUT', `/api/groups/${group._id}/members/${member._id}`, { role: 'SUPERUSER' }, cookie);
    const res = await updateMemberRole(req, params(String(group._id), String(member._id)));
    expect(res.status).toBe(400);
  });

  it('retourne 400 si l\'on tente de rétrograder le seul admin', async () => {
    const owner = await createTestUser({ username: 'memrole7', email: 'memrole7@example.com' });
    const group = await createTestGroup(owner._id, { name: 'role-group-4' });
    const cookie = await createAuthCookie(owner._id, 'USER');
    const req = makeRequest('PUT', `/api/groups/${group._id}/members/${owner._id}`, { role: 'MEMBER' }, cookie);
    const res = await updateMemberRole(req, params(String(group._id), String(owner._id)));
    expect(res.status).toBe(400);
  });

  it('promeut un membre en admin et retourne 200', async () => {
    const owner = await createTestUser({ username: 'memrole8', email: 'memrole8@example.com' });
    const member = await createTestUser({ username: 'memrole9', email: 'memrole9@example.com' });
    const group = await createTestGroup(owner._id, { name: 'role-group-5' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: member._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: owner._id } },
    });
    const cookie = await createAuthCookie(owner._id, 'USER');
    const req = makeRequest('PUT', `/api/groups/${group._id}/members/${member._id}`, { role: 'ADMIN' }, cookie);
    const res = await updateMemberRole(req, params(String(group._id), String(member._id)));
    const data = await res.json();

    expect(res.status).toBe(200);
    const m = data.members.find((m: { userId: string }) => m.userId.toString() === String(member._id));
    expect(m?.role).toBe('ADMIN');
  });
});
