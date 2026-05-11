import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as login } from '../../app/api/auth/login/route';
import { POST as logout } from '../../app/api/auth/logout/route';
import { GET as me } from '../../app/api/auth/me/route';
import SessionModel from '@models/Session';
import { createTestUser, createAuthCookie, makeRequest } from '../test/helpers';

function makeLoginRequest(body: unknown, ip = 'test-default') {
  return new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/login', () => {
  it('retourne 200 et un cookie de session avec des identifiants valides', async () => {
    await createTestUser({ username: 'player', email: 'player@example.com', password: 'StrongPass1!' });

    const req = makeLoginRequest({ username: 'player', password: 'StrongPass1!' }, 'ip-login-ok');
    const res = await login(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.role).toBe('USER');
    expect(res.headers.get('set-cookie')).toMatch(/session=/);
  });

  it('retourne 401 avec un mot de passe incorrect', async () => {
    await createTestUser({ username: 'player2', email: 'player2@example.com' });

    const req = makeLoginRequest({ username: 'player2', password: 'WrongPassword1!' }, 'ip-wrong-pwd');
    const res = await login(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toMatch(/invalides/i);
  });

  it('retourne 401 avec un username inconnu (même message, pas d\'énumération)', async () => {
    const req = makeLoginRequest({ username: 'nobody', password: 'SomePassword1!' }, 'ip-unknown-user');
    const res = await login(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toMatch(/invalides/i);
  });

  it('retourne 429 après trop de tentatives échouées', async () => {
    await createTestUser({ username: 'victim', email: 'victim@example.com' });
    const ip = 'ip-rate-limit-test';

    // Épuise le rate limiter avec des mots de passe incorrects
    let lastStatus = 401;
    for (let i = 0; i < 10; i++) {
      const req = makeLoginRequest({ username: 'victim', password: 'WrongPass1!' }, ip);
      const res = await login(req);
      lastStatus = res.status;
      if (lastStatus === 429) break;
    }

    expect(lastStatus).toBe(429);
  });

  it('crée une session en BDD après un login réussi', async () => {
    await createTestUser({ username: 'sessioncheck', email: 'sessioncheck@example.com', password: 'StrongPass1!' });

    const req = makeLoginRequest({ username: 'sessioncheck', password: 'StrongPass1!' }, 'ip-session-check');
    await login(req);

    const count = await SessionModel.countDocuments({});
    expect(count).toBeGreaterThan(0);
  });
});

describe('GET /api/auth/me', () => {
  it('retourne les données utilisateur avec une session valide', async () => {
    const user = await createTestUser({ username: 'meuser', email: 'me@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');

    const req = makeRequest('GET', '/api/auth/me', undefined, await cookie);
    const res = await me(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.username).toBe('meuser');
    expect(data.role).toBe('USER');
    expect(data.id).toBe(String(user._id));
  });

  it('retourne 401 sans cookie de session', async () => {
    const req = makeRequest('GET', '/api/auth/me');
    const res = await me(req);
    expect(res.status).toBe(401);
  });

  it('retourne 401 si la session a été révoquée en BDD', async () => {
    const user = await createTestUser({ username: 'revokeduser', email: 'revoked@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');

    // Supprime la session directement en BDD
    await SessionModel.deleteMany({ userId: user._id });

    const req = makeRequest('GET', '/api/auth/me', undefined, await cookie);
    const res = await me(req);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('retourne 200 et efface le cookie', async () => {
    const user = await createTestUser({ username: 'logoutuser', email: 'logout@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');

    const req = makeRequest('POST', '/api/auth/logout', undefined, await cookie);
    const res = await logout(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toMatch(/session=;|session=($|;)/);
  });

  it('supprime la session de la BDD', async () => {
    const user = await createTestUser({ username: 'logoutdb', email: 'logoutdb@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');

    const sessionsBefore = await SessionModel.countDocuments({ userId: user._id });
    expect(sessionsBefore).toBe(1);

    const req = makeRequest('POST', '/api/auth/logout', undefined, await cookie);
    await logout(req);

    const sessionsAfter = await SessionModel.countDocuments({ userId: user._id });
    expect(sessionsAfter).toBe(0);
  });

  it('retourne 200 même sans session active (idempotent)', async () => {
    const req = makeRequest('POST', '/api/auth/logout');
    const res = await logout(req);
    expect(res.status).toBe(200);
  });
});
