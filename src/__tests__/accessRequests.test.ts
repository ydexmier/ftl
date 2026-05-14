import { describe, it, expect, vi } from 'vitest';
import { POST as postRequest } from '../../app/api/access-requests/route';
import { GET as getAdminRequests } from '../../app/api/admin/access-requests/route';
import { PATCH as patchRequest } from '../../app/api/admin/access-requests/[id]/route';
import AccessRequestModel from '@models/AccessRequest';
import { createTestUser, createAuthCookie, makeRequest } from '../test/helpers';

vi.mock('@/src/lib/hcaptcha', () => ({
  verifyHcaptcha: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/src/lib/email', () => ({
  sendInvitationEmail: vi.fn().mockResolvedValue(undefined),
}));

function idParam(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ─── POST /api/access-requests ───────────────────────────────────────────────

describe('POST /api/access-requests', () => {
  it('retourne 400 si email invalide', async () => {
    const req = makeRequest('POST', '/api/access-requests', {
      email: 'notanemail',
      captchaToken: 'tok',
    });
    const res = await postRequest(req);
    expect(res.status).toBe(400);
  });

  it('retourne 400 si pas de captchaToken', async () => {
    const req = makeRequest('POST', '/api/access-requests', { email: 'a@test.com' });
    const res = await postRequest(req);
    expect(res.status).toBe(400);
  });

  it('retourne 400 si un compte existe déjà', async () => {
    await createTestUser({ username: 'ar1', email: 'ar1@test.com' });
    const req = makeRequest('POST', '/api/access-requests', {
      email: 'ar1@test.com',
      captchaToken: 'tok',
    });
    const res = await postRequest(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/compte existe déjà/i);
  });

  it('retourne 400 si une demande est déjà en attente', async () => {
    await AccessRequestModel.create({ email: 'ar2@test.com', status: 'PENDING' });
    const req = makeRequest('POST', '/api/access-requests', {
      email: 'ar2@test.com',
      captchaToken: 'tok',
    });
    const res = await postRequest(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/demande est déjà en attente/i);
  });

  it('crée la demande avec succès', async () => {
    const req = makeRequest('POST', '/api/access-requests', {
      email: 'ar3@test.com',
      reason: 'Je veux jouer',
      captchaToken: 'tok',
    });
    const res = await postRequest(req);
    expect(res.status).toBe(201);
    const doc = await AccessRequestModel.findOne({ email: 'ar3@test.com' });
    expect(doc).not.toBeNull();
    expect(doc!.reason).toBe('Je veux jouer');
    expect(doc!.status).toBe('PENDING');
  });
});

// ─── GET /api/admin/access-requests ─────────────────────────────────────────

describe('GET /api/admin/access-requests', () => {
  it('retourne 401 sans session admin', async () => {
    const req = makeRequest('GET', '/api/admin/access-requests');
    const res = await getAdminRequests(req);
    expect(res.status).toBe(401);
  });

  it('retourne la liste paginée', async () => {
    const admin = await createTestUser({ username: 'ar4', email: 'ar4@test.com', role: 'ADMIN' });
    await AccessRequestModel.insertMany([
      { email: 'req1@test.com', status: 'PENDING' },
      { email: 'req2@test.com', status: 'APPROVED' },
    ]);

    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('GET', '/api/admin/access-requests', undefined, cookie);
    const res = await getAdminRequests(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.requests.length).toBeGreaterThanOrEqual(2);
    expect(typeof data.total).toBe('number');
  });
});

// ─── PATCH /api/admin/access-requests/[id] ───────────────────────────────────

describe('PATCH /api/admin/access-requests/[id]', () => {
  it('retourne 401 sans session admin', async () => {
    const req = makeRequest('PATCH', '/api/admin/access-requests/fakeid', { action: 'reject' });
    const res = await patchRequest(req, idParam('fakeid'));
    expect(res.status).toBe(401);
  });

  it('rejette une demande', async () => {
    const admin = await createTestUser({ username: 'ar5', email: 'ar5@test.com', role: 'ADMIN' });
    const request = await AccessRequestModel.create({ email: 'ar6@test.com', status: 'PENDING' });

    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest(
      'PATCH',
      `/api/admin/access-requests/${request._id}`,
      { action: 'reject' },
      cookie,
    );
    const res = await patchRequest(req, idParam(String(request._id)));
    expect(res.status).toBe(200);
    const doc = await AccessRequestModel.findById(request._id);
    expect(doc!.status).toBe('REJECTED');
  });

  it('approuve une demande et envoie l\'invitation', async () => {
    const admin = await createTestUser({ username: 'ar7', email: 'ar7@test.com', role: 'ADMIN' });
    const request = await AccessRequestModel.create({ email: 'ar8@test.com', status: 'PENDING' });

    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest(
      'PATCH',
      `/api/admin/access-requests/${request._id}`,
      { action: 'approve' },
      cookie,
    );
    const res = await patchRequest(req, idParam(String(request._id)));
    expect(res.status).toBe(200);
    const doc = await AccessRequestModel.findById(request._id);
    expect(doc!.status).toBe('APPROVED');
  });

  it('retourne 400 si la demande est déjà traitée', async () => {
    const admin = await createTestUser({ username: 'ar9', email: 'ar9@test.com', role: 'ADMIN' });
    const request = await AccessRequestModel.create({ email: 'ar10@test.com', status: 'APPROVED' });

    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest(
      'PATCH',
      `/api/admin/access-requests/${request._id}`,
      { action: 'reject' },
      cookie,
    );
    const res = await patchRequest(req, idParam(String(request._id)));
    expect(res.status).toBe(400);
  });
});
