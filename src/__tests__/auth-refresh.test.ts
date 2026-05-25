import { describe, it, expect } from 'vitest';
import SessionModel from '@models/Session';
import { POST as refresh } from '../../app/api/auth/refresh/route';
import { signCookie } from '@/src/lib/auth/cookieSign';
import { createTestUser, createAuthCookie, makeRequest } from '../test/helpers';

describe('POST /api/auth/refresh', () => {
  it('retourne 200 et réémet un cookie frais avec une session valide', async () => {
    const user = await createTestUser({ username: 'refreshuser1', email: 'refresh1@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('POST', '/api/auth/refresh', undefined, cookie);
    const res = await refresh(req);

    expect(res.status).toBe(200);
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toMatch(/session=/);
    expect(setCookie).toMatch(/max-age=28800/i);
  });

  it('met à jour lastActivityAt en BDD après un refresh réussi', async () => {
    const user = await createTestUser({ username: 'refreshuser2', email: 'refresh2@example.com' });
    const beforeTime = Date.now();
    const cookie = await createAuthCookie(user._id, 'USER');

    const req = makeRequest('POST', '/api/auth/refresh', undefined, cookie);
    await refresh(req);

    const session = await SessionModel.findOne({ userId: user._id }).lean();
    expect(session?.lastActivityAt.getTime()).toBeGreaterThanOrEqual(beforeTime);
  });

  it('retourne 401 sans cookie', async () => {
    const req = makeRequest('POST', '/api/auth/refresh');
    const res = await refresh(req);
    expect(res.status).toBe(401);
  });

  it('retourne 401 avec un cookie dont la signature HMAC est invalide', async () => {
    const req = makeRequest('POST', '/api/auth/refresh', undefined, 'invalid-cookie-value');
    const res = await refresh(req);
    expect(res.status).toBe(401);
  });

  it('retourne 401 avec une session dont expiresAt est dépassé', async () => {
    const user = await createTestUser({ username: 'refreshuser3', email: 'refresh3@example.com' });
    const sessionId = crypto.randomUUID();
    await SessionModel.create({
      sessionId,
      userId: user._id,
      role: 'USER',
      expiresAt: new Date(Date.now() - 1000),
      lastActivityAt: new Date(),
    });
    const cookie = await signCookie(sessionId, 'USER');
    const req = makeRequest('POST', '/api/auth/refresh', undefined, cookie);
    const res = await refresh(req);
    expect(res.status).toBe(401);
  });

  it("retourne 401 quand lastActivityAt dépasse la fenêtre d'inactivité", async () => {
    const user = await createTestUser({ username: 'refreshuser4', email: 'refresh4@example.com' });
    const sessionId = crypto.randomUUID();
    await SessionModel.create({
      sessionId,
      userId: user._id,
      role: 'USER',
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      lastActivityAt: new Date(Date.now() - 9 * 60 * 60 * 1000),
    });
    const cookie = await signCookie(sessionId, 'USER');
    const req = makeRequest('POST', '/api/auth/refresh', undefined, cookie);
    const res = await refresh(req);
    expect(res.status).toBe(401);
  });
});
