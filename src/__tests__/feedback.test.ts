import { describe, it, expect } from 'vitest';
import { POST as postFeedback } from '../../app/api/feedback/route';
import { GET as adminGetFeedbacks } from '../../app/api/admin/feedback/route';
import { PATCH as adminPatchFeedback } from '../../app/api/admin/feedback/[id]/route';
import FeedbackModel from '@models/Feedback';
import { createTestUser, createAdminUser, createAuthCookie, makeRequest } from '../test/helpers';

function idParam(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ─── POST /api/feedback ───────────────────────────────────────────────────────

describe('POST /api/feedback', () => {
  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('POST', '/api/feedback', {
      type: 'bug',
      title: 'Titre',
      description: 'Description du bug',
      page: '/tournaments',
    });
    const res = await postFeedback(req);
    expect(res.status).toBe(401);
  });

  it('retourne 400 si type invalide', async () => {
    const user = await createTestUser({ username: 'fb1', email: 'fb1@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest(
      'POST',
      '/api/feedback',
      { type: 'invalid', title: 'Titre', description: 'Description', page: '/' },
      cookie,
    );
    const res = await postFeedback(req);
    expect(res.status).toBe(400);
  });

  it('retourne 400 si titre vide', async () => {
    const user = await createTestUser({ username: 'fb2', email: 'fb2@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest(
      'POST',
      '/api/feedback',
      { type: 'bug', title: '', description: 'Description', page: '/' },
      cookie,
    );
    const res = await postFeedback(req);
    expect(res.status).toBe(400);
  });

  it('retourne 400 si description vide', async () => {
    const user = await createTestUser({ username: 'fb3', email: 'fb3@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest(
      'POST',
      '/api/feedback',
      { type: 'improvement', title: 'Titre', description: '', page: '/' },
      cookie,
    );
    const res = await postFeedback(req);
    expect(res.status).toBe(400);
  });

  it('retourne 400 si page manquante', async () => {
    const user = await createTestUser({ username: 'fb4', email: 'fb4@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest(
      'POST',
      '/api/feedback',
      { type: 'bug', title: 'Titre', description: 'Description' },
      cookie,
    );
    const res = await postFeedback(req);
    expect(res.status).toBe(400);
  });

  it('crée un feedback et retourne 201', async () => {
    const user = await createTestUser({ username: 'fb5', email: 'fb5@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest(
      'POST',
      '/api/feedback',
      { type: 'bug', title: 'Bug dans le tournoi', description: 'Les scores ne s\'affichent pas', page: '/tournaments' },
      cookie,
    );
    const res = await postFeedback(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.submitted).toBe(true);
    const saved = await FeedbackModel.findOne({ title: 'Bug dans le tournoi' });
    expect(saved).not.toBeNull();
    expect(saved?.type).toBe('bug');
  });
});

// ─── GET /api/admin/feedback ──────────────────────────────────────────────────

describe('GET /api/admin/feedback', () => {
  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('GET', '/api/admin/feedback');
    const res = await adminGetFeedbacks(req);
    expect(res.status).toBe(401);
  });

  it('retourne 403 pour un USER', async () => {
    const user = await createTestUser({ username: 'fb6', email: 'fb6@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', '/api/admin/feedback', undefined, cookie);
    const res = await adminGetFeedbacks(req);
    expect(res.status).toBe(403);
  });

  it('retourne la liste des feedbacks pour un ADMIN', async () => {
    await FeedbackModel.create([
      { type: 'bug', title: 'Bug A', description: 'Desc A', page: '/', status: 'open' },
      { type: 'improvement', title: 'Amélio B', description: 'Desc B', page: '/', status: 'done' },
    ]);
    const admin = await createAdminUser({ username: 'fbadmin', email: 'fbadmin@test.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('GET', '/api/admin/feedback?page=1', undefined, cookie);
    const res = await adminGetFeedbacks(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.total).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(data.feedbacks)).toBe(true);
  });

  it('filtre par status', async () => {
    await FeedbackModel.create([
      { type: 'bug', title: 'Bug Open', description: 'Desc', page: '/', status: 'open' },
      { type: 'bug', title: 'Bug Closed', description: 'Desc', page: '/', status: 'closed' },
    ]);
    const admin = await createAdminUser({ username: 'fbadmin2', email: 'fbadmin2@test.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('GET', '/api/admin/feedback?status=open', undefined, cookie);
    const res = await adminGetFeedbacks(req);
    const data = await res.json();
    const allOpen = (data.feedbacks as { status: string }[]).every((f) => f.status === 'open');
    expect(allOpen).toBe(true);
  });
});

// ─── PATCH /api/admin/feedback/[id] ──────────────────────────────────────────

describe('PATCH /api/admin/feedback/[id]', () => {
  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('PATCH', '/api/admin/feedback/someid', { status: 'done' });
    const res = await adminPatchFeedback(req, idParam('someid'));
    expect(res.status).toBe(401);
  });

  it('retourne 403 pour un USER', async () => {
    const user = await createTestUser({ username: 'fb7', email: 'fb7@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('PATCH', '/api/admin/feedback/someid', { status: 'done' }, cookie);
    const res = await adminPatchFeedback(req, idParam('someid'));
    expect(res.status).toBe(403);
  });

  it('retourne 400 pour un statut invalide', async () => {
    const admin = await createAdminUser({ username: 'fbadmin3', email: 'fbadmin3@test.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('PATCH', '/api/admin/feedback/someid', { status: 'unknown' }, cookie);
    const res = await adminPatchFeedback(req, idParam('someid'));
    expect(res.status).toBe(400);
  });

  it('retourne 404 si feedback inexistant', async () => {
    const admin = await createAdminUser({ username: 'fbadmin4', email: 'fbadmin4@test.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const { Types } = await import('mongoose');
    const fakeId = new Types.ObjectId().toHexString();
    const req = makeRequest('PATCH', `/api/admin/feedback/${fakeId}`, { status: 'done' }, cookie);
    const res = await adminPatchFeedback(req, idParam(fakeId));
    expect(res.status).toBe(404);
  });

  it('met à jour le statut et retourne 200', async () => {
    const fb = await FeedbackModel.create({
      type: 'bug',
      title: 'Bug à traiter',
      description: 'Desc',
      page: '/',
      status: 'open',
    });
    const admin = await createAdminUser({ username: 'fbadmin5', email: 'fbadmin5@test.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const id = fb._id.toHexString();
    const req = makeRequest('PATCH', `/api/admin/feedback/${id}`, { status: 'in-progress' }, cookie);
    const res = await adminPatchFeedback(req, idParam(id));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('in-progress');
  });
});
